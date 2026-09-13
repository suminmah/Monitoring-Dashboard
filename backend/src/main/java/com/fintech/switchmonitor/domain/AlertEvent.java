package com.fintech.switchmonitor.domain;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.Instant;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class AlertEvent {
    private String id;
    private String type;
    private String message;
    private String severity; // CRITICAL, WARNING
    private Instant timestamp;
}
