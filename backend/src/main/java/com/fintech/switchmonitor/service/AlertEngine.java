package com.fintech.switchmonitor.service;

import com.fintech.switchmonitor.domain.AlertEvent;
import com.fintech.switchmonitor.domain.MetricsSummary;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.UUID;

@Service
public class AlertEngine {

    private final MetricsAggregationService metricsAggregationService;
    private final SimpMessagingTemplate messagingTemplate;

    public AlertEngine(MetricsAggregationService metricsAggregationService, SimpMessagingTemplate messagingTemplate) {
        this.metricsAggregationService = metricsAggregationService;
        this.messagingTemplate = messagingTemplate;
    }

    @Scheduled(fixedRate = 5000) // Evaluate rules every 5 seconds
    public void evaluateRules() {
        // GLOBAL Alert Checks
        MetricsSummary global = metricsAggregationService.getMetrics("GLOBAL", 3);
        if (global.getTotalVolume() >= 20) {
            if (global.getSystemicFailureRate() > 2.0) {
                emitAlert("SYSTEMIC_DEGRADATION", "Global systemic failure rate is elevated: " + String.format("%.2f", global.getSystemicFailureRate()) + "%", "CRITICAL");
            }
        }

        // Dimensional SLA Watchdog
        String[] institutions = {"Bank_A", "Bank_B", "Wallet_C", "PSP_D"};
        String[] services = {"IBFT", "QR_MERCHANT", "NPCI_CROSSBORDER", "ALIPAY_INBOUND"};
        
        for (String inst : institutions) {
            for (String svc : services) {
                String dim = "INST:" + inst + ":SVC:" + svc;
                
                // Bayesian Smoothing: require 20 txns in 3-minute window to avoid false positives on sparse corridors
                MetricsSummary summary3m = metricsAggregationService.getMetrics(dim, 3);
                
                if (summary3m.getTotalVolume() < 20) continue;

                // SLA 1: Bank A IBFT failure > 8%
                if ("Bank_A".equals(inst) && "IBFT".equals(svc)) {
                    if (summary3m.getFailureRate() > 8.0) {
                        emitAlert("SLA_BREACH", "Bank A IBFT failure rate exceeded 8%: " + String.format("%.2f", summary3m.getFailureRate()) + "%", "CRITICAL");
                    }
                }
                
                // SLA 2: NPCI timeout > 2%
                if ("NPCI_CROSSBORDER".equals(svc) && summary3m.getTimeoutRate() > 2.0) {
                    emitAlert("GATEWAY_DEGRADED", "NPCI Cross-Border timeout rate exceeded 2% for " + inst, "CRITICAL");
                }
                
                // Latency Anomaly: P99 > 3000ms
                if (summary3m.getP99Latency() > 3000) {
                    emitAlert("HIGH_LATENCY", "P99 latency spiked to " + summary3m.getP99Latency() + "ms for " + inst + " on " + svc, "WARNING");
                }
            }
        }
    }

    private void emitAlert(String type, String message, String severity) {
        AlertEvent event = new AlertEvent(UUID.randomUUID().toString(), type, message, severity, Instant.now());
        // Push alert via WebSocket
        messagingTemplate.convertAndSend("/topic/alerts", event);
        System.out.println("ALERT EMITTED: [" + severity + "] " + message);
    }
}
