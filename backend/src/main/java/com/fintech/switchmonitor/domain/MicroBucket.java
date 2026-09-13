package com.fintech.switchmonitor.domain;

import lombok.Data;
import java.util.HashMap;
import java.util.Map;

@Data
public class MicroBucket {
    private long bucketId;
    private long totalVolume;
    private long successCount;
    private long timeoutCount;
    private long failureCount;
    private long systemicFailureCount;
    private Map<String, Integer> errorCodes = new HashMap<>();
    private String histogramBase64;
}
