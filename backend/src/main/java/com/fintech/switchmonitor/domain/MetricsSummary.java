package com.fintech.switchmonitor.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.*;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class MetricsSummary {
    private Instant timestamp;
    private String institutionId;
    private String serviceType;
    private String gateway;
    
    private long totalVolume;
    private double successRate;
    private double timeoutRate;
    private double failureRate;
    private double systemicFailureRate;
    
    private double p50Latency;
    private double p95Latency;
    private double p99Latency;
    
    private java.util.Map<String, Integer> topErrorCodes;
}
