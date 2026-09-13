package com.fintech.switchmonitor.domain;

import jakarta.persistence.*;
import lombok.Data;
import java.time.Instant;

@Data
@Entity
@Table(name = "transactions") // keep table name or change to switch_transactions
public class SwitchTransaction {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String transactionId;

    private String rrn;
    private String panMasked;
    private Double amount;
    private String channel;
    
    // New Multi-Dimensional Fields
    private String institutionId;
    private String serviceType;
    private String subChannel;
    private String settlementType;
    private String gateway;

    private String responseCode;
    
    @Enumerated(EnumType.STRING)
    private Status status;
    
    private Long latencyMs;
    private Instant timestamp;

    public enum Status {
        INITIATED, SWITCH_PROCESSING, ROUTED_TO_DESTINATION, ACKNOWLEDGED, TIMEOUT, COMPLETED, FAILED
    }
}
