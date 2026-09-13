package com.fintech.switchmonitor.controller;

import com.fintech.switchmonitor.domain.MetricsSummary;
import com.fintech.switchmonitor.service.MetricsAggregationService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/transactions")
@CrossOrigin(origins = "*") // For development purposes
public class TransactionController {

    private final MetricsAggregationService metricsAggregationService;

    public TransactionController(MetricsAggregationService metricsAggregationService) {
        this.metricsAggregationService = metricsAggregationService;
    }

    @GetMapping("/stats")
    public MetricsSummary getStats(
            @RequestParam(defaultValue = "GLOBAL") String dimension, 
            @RequestParam(defaultValue = "1") int windowMinutes) {
        return metricsAggregationService.getMetrics(dimension, windowMinutes);
    }
}
