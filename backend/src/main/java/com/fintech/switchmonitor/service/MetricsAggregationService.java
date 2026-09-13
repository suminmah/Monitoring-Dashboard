package com.fintech.switchmonitor.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fintech.switchmonitor.domain.MetricsSummary;
import com.fintech.switchmonitor.domain.MicroBucket;
import com.fintech.switchmonitor.domain.SwitchTransaction;
import org.HdrHistogram.Histogram;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.nio.ByteBuffer;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.zip.Deflater;

@Service
public class MetricsAggregationService {

    private final StringRedisTemplate redisTemplate;
    private final FailureClassifier failureClassifier;
    private final ObjectMapper objectMapper;

    // Local memory buffers for the current 10-second slice
    // Map: Dimension -> BucketId -> MicroBucket
    private final Map<String, Map<Long, MicroBucket>> localBuffer = new ConcurrentHashMap<>();
    private final Map<String, Map<Long, Histogram>> localHistograms = new ConcurrentHashMap<>();

    public MetricsAggregationService(StringRedisTemplate redisTemplate, FailureClassifier failureClassifier) {
        this.redisTemplate = redisTemplate;
        this.failureClassifier = failureClassifier;
        this.objectMapper = new ObjectMapper();
    }

    public void addTransaction(SwitchTransaction tx) {
        long timestamp = tx.getTimestamp().toEpochMilli();
        long bucketId = timestamp / 10000; // 10-second buckets

        FailureClassifier.FailureType failType = failureClassifier.classify(tx);
        String resCode = tx.getResponseCode() == null ? "NA" : tx.getResponseCode();
        
        List<String> dimensionKeys = Arrays.asList(
            "GLOBAL",
            "INST:" + tx.getInstitutionId(),
            "INST:" + tx.getInstitutionId() + ":SVC:" + tx.getServiceType(),
            "INST:" + tx.getInstitutionId() + ":SETTLE:" + tx.getSettlementType()
        );

        for (String dim : dimensionKeys) {
            if (dim.contains("SETTLE")) {
                System.out.println("Adding to dimension: " + dim);
            }
            localBuffer.putIfAbsent(dim, new ConcurrentHashMap<>());
            localHistograms.putIfAbsent(dim, new ConcurrentHashMap<>());

            Map<Long, MicroBucket> dimBuckets = localBuffer.get(dim);
            Map<Long, Histogram> dimHistograms = localHistograms.get(dim);

            dimBuckets.putIfAbsent(bucketId, new MicroBucket());
            dimHistograms.putIfAbsent(bucketId, new Histogram(3600000L, 2)); // Up to 1 hour max latency, 2 sig digits

            MicroBucket bucket = dimBuckets.get(bucketId);
            Histogram hist = dimHistograms.get(bucketId);

            synchronized (bucket) {
                bucket.setBucketId(bucketId);
                bucket.setTotalVolume(bucket.getTotalVolume() + 1);
                
                if (tx.getStatus() == SwitchTransaction.Status.COMPLETED) {
                    bucket.setSuccessCount(bucket.getSuccessCount() + 1);
                } else if (tx.getStatus() == SwitchTransaction.Status.TIMEOUT) {
                    bucket.setTimeoutCount(bucket.getTimeoutCount() + 1);
                    bucket.setSystemicFailureCount(bucket.getSystemicFailureCount() + 1);
                } else if (tx.getStatus() == SwitchTransaction.Status.FAILED) {
                    bucket.setFailureCount(bucket.getFailureCount() + 1);
                    if (failType == FailureClassifier.FailureType.SYSTEMIC) {
                        bucket.setSystemicFailureCount(bucket.getSystemicFailureCount() + 1);
                    }
                    bucket.getErrorCodes().put(resCode, bucket.getErrorCodes().getOrDefault(resCode, 0) + 1);
                }
                
                if (tx.getLatencyMs() != null) {
                    hist.recordValue(tx.getLatencyMs());
                }
            }
        }
    }

    // Flush local buffers to Redis every 2 seconds
    @Scheduled(fixedRate = 2000)
    public void flushToRedis() {
        long currentBucketId = Instant.now().toEpochMilli() / 10000;
        
        for (String dim : localBuffer.keySet()) {
            Map<Long, MicroBucket> dimBuckets = localBuffer.get(dim);
            Map<Long, Histogram> dimHistograms = localHistograms.get(dim);
            
            if (dimBuckets == null) continue;

            List<Long> keysToFlush = new ArrayList<>();
            for (Long bucketId : dimBuckets.keySet()) {
                // Keep the current bucket in memory to aggregate, flush others, or just overwrite current in Redis?
                // Overwriting the current bucket in Redis is fine, it allows real-time dashboards to see partial 10s windows.
                MicroBucket bucket = dimBuckets.get(bucketId);
                Histogram hist = dimHistograms.get(bucketId);
                
                synchronized (bucket) {
                    try {
                        ByteBuffer buffer = ByteBuffer.allocate(hist.getEstimatedFootprintInBytes());
                        hist.encodeIntoCompressedByteBuffer(buffer, Deflater.BEST_COMPRESSION);
                        buffer.flip();
                        byte[] bytes = new byte[buffer.remaining()];
                        buffer.get(bytes);
                        bucket.setHistogramBase64(Base64.getEncoder().encodeToString(bytes));
                        
                        String json = objectMapper.writeValueAsString(bucket);
                        String redisKey = "tx:dim:" + dim + ":bucket";
                        redisTemplate.opsForHash().put(redisKey, String.valueOf(bucketId), json);
                        
                        // Set TTL on the hash key (e.g. 10 minutes)
                        redisTemplate.expire(redisKey, java.time.Duration.ofMinutes(10));
                    } catch (Exception e) {
                        e.printStackTrace();
                    }
                }
                
                // If it's an old bucket, remove from local memory
                if (bucketId < currentBucketId - 1) {
                    keysToFlush.add(bucketId);
                }
            }
            
            for (Long k : keysToFlush) {
                dimBuckets.remove(k);
                dimHistograms.remove(k);
            }
        }
    }

    public MetricsSummary getMetrics(String dimension, int windowMinutes) {
        long currentBucketId = Instant.now().toEpochMilli() / 10000;
        int numBuckets = (windowMinutes * 60) / 10;
        
        String redisKey = "tx:dim:" + dimension + ":bucket";
        
        List<String> hashKeys = new ArrayList<>();
        for (int i = 0; i < numBuckets; i++) {
            hashKeys.add(String.valueOf(currentBucketId - i));
        }
        
        List<Object> jsons = redisTemplate.opsForHash().multiGet(redisKey, new ArrayList<>(hashKeys));
        
        MetricsSummary summary = new MetricsSummary();
        summary.setTimestamp(Instant.now());
        if (dimension.startsWith("INST:")) {
            String[] parts = dimension.split(":");
            summary.setInstitutionId(parts[1]);
            if (parts.length > 3) {
                if ("SVC".equals(parts[2])) {
                    summary.setServiceType(parts[3]);
                } else if ("SETTLE".equals(parts[2])) {
                    summary.setServiceType("SETTLE_" + parts[3]);
                }
            }
        }
        
        long totalVolume = 0;
        long successCount = 0;
        long failureCount = 0;
        long timeoutCount = 0;
        long systemicFailCount = 0;
        Map<String, Integer> errorCodes = new HashMap<>();
        Histogram combinedHist = new Histogram(3600000L, 2);

        for (Object jsonObj : jsons) {
            if (jsonObj != null) {
                try {
                    MicroBucket bucket = objectMapper.readValue((String) jsonObj, MicroBucket.class);
                    totalVolume += bucket.getTotalVolume();
                    successCount += bucket.getSuccessCount();
                    failureCount += bucket.getFailureCount();
                    timeoutCount += bucket.getTimeoutCount();
                    systemicFailCount += bucket.getSystemicFailureCount();
                    
                    bucket.getErrorCodes().forEach((k, v) -> errorCodes.put(k, errorCodes.getOrDefault(k, 0) + v));
                    
                    if (bucket.getHistogramBase64() != null) {
                        byte[] bytes = Base64.getDecoder().decode(bucket.getHistogramBase64());
                        Histogram hist = Histogram.decodeFromCompressedByteBuffer(ByteBuffer.wrap(bytes), 3600000L);
                        combinedHist.add(hist);
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
        
        summary.setTotalVolume(totalVolume);
        if (totalVolume > 0) {
            summary.setSuccessRate((double) successCount / totalVolume * 100);
            summary.setFailureRate((double) failureCount / totalVolume * 100);
            summary.setTimeoutRate((double) timeoutCount / totalVolume * 100);
            summary.setSystemicFailureRate((double) systemicFailCount / totalVolume * 100);
            summary.setTopErrorCodes(errorCodes);
            
            summary.setP50Latency(combinedHist.getValueAtPercentile(50.0));
            summary.setP95Latency(combinedHist.getValueAtPercentile(95.0));
            summary.setP99Latency(combinedHist.getValueAtPercentile(99.0));
        } else {
            summary.setSuccessRate(0);
            summary.setFailureRate(0);
            summary.setTimeoutRate(0);
            summary.setSystemicFailureRate(0);
            summary.setTopErrorCodes(new HashMap<>());
            summary.setP50Latency(0);
            summary.setP95Latency(0);
            summary.setP99Latency(0);
        }

        return summary;
    }
}
