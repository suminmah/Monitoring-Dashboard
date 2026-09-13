package com.fintech.switchmonitor.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fintech.switchmonitor.domain.SwitchTransaction;
import com.fintech.switchmonitor.domain.SwitchTransactionRepository;
import com.fintech.switchmonitor.service.MetricsAggregationService;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Service;

@Service
public class TransactionListener {

    private final ObjectMapper objectMapper;
    private final MetricsAggregationService metricsAggregationService;
    private final SwitchTransactionRepository transactionRepository;

    public TransactionListener(MetricsAggregationService metricsAggregationService, SwitchTransactionRepository transactionRepository) {
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
        this.metricsAggregationService = metricsAggregationService;
        this.transactionRepository = transactionRepository;
    }

    @KafkaListener(topics = "switch-transactions", groupId = "switch-monitor-group")
    public void consume(String message) {
        try {
            SwitchTransaction tx = objectMapper.readValue(message, SwitchTransaction.class);
            if (tx != null) {
                // Save to DB
                transactionRepository.save(tx);
                // Add to Aggregation Window
                metricsAggregationService.addTransaction(tx);
            }
        } catch (Exception e) {
            System.err.println("Error processing transaction message: " + e.getMessage());
        }
    }
}
