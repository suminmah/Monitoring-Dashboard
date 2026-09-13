package com.fintech.switchmonitor.controller;

import com.fintech.switchmonitor.domain.MetricsSummary;
import com.fintech.switchmonitor.service.MetricsAggregationService;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Controller;

@Controller
public class MetricsWebSocketController {

    private final SimpMessagingTemplate messagingTemplate;
    private final MetricsAggregationService metricsAggregationService;

    public MetricsWebSocketController(SimpMessagingTemplate messagingTemplate, MetricsAggregationService metricsAggregationService) {
        this.messagingTemplate = messagingTemplate;
        this.metricsAggregationService = metricsAggregationService;
    }

    @Scheduled(fixedRate = 1000) // Push every 1 second (1Hz)
    public void pushMetrics() {
        // Fetch GLOBAL metrics
        MetricsSummary global = metricsAggregationService.getMetrics("GLOBAL", 1);
        if (global != null) {
            messagingTemplate.convertAndSend("/topic/metrics", global);
        }

        // Fetch matrix for all dimensions
        String[] institutions = {"Bank_A", "Bank_B", "Wallet_C", "PSP_D"};
        String[] services = {"IBFT", "QR_MERCHANT", "NPCI_CROSSBORDER", "ALIPAY_INBOUND", "SETTLE_INSTANT", "SETTLE_BATCH", "SETTLE_ON_REQUEST"};
        
        java.util.List<MetricsSummary> matrix = new java.util.ArrayList<>();
        for (String inst : institutions) {
            for (String svc : services) {
                String dimensionKey;
                if (svc.startsWith("SETTLE_")) {
                    dimensionKey = "INST:" + inst + ":SETTLE:" + svc.substring(7);
                } else {
                    dimensionKey = "INST:" + inst + ":SVC:" + svc;
                }
                
                MetricsSummary summary = metricsAggregationService.getMetrics(dimensionKey, 1);
                if (summary != null) {
                    matrix.add(summary);
                }
            }
        }
        messagingTemplate.convertAndSend("/topic/global-matrix", matrix);
    }
}
