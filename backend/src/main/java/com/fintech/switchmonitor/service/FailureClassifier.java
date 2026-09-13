package com.fintech.switchmonitor.service;

import com.fintech.switchmonitor.domain.SwitchTransaction;
import org.springframework.stereotype.Service;

import java.util.Set;

@Service
public class FailureClassifier {

    private static final Set<String> SYSTEMIC_ERROR_CODES = Set.of("91", "96", "06", "92");
    private static final Set<String> BUSINESS_ERROR_CODES = Set.of("51", "14", "54", "55", "05");

    public FailureType classify(SwitchTransaction tx) {
        if (tx.getStatus() == SwitchTransaction.Status.COMPLETED) {
            return FailureType.NONE;
        }

        if (tx.getStatus() == SwitchTransaction.Status.TIMEOUT) {
            return FailureType.SYSTEMIC;
        }

        if (tx.getResponseCode() != null) {
            if (SYSTEMIC_ERROR_CODES.contains(tx.getResponseCode())) {
                return FailureType.SYSTEMIC;
            }
            if (BUSINESS_ERROR_CODES.contains(tx.getResponseCode())) {
                return FailureType.BUSINESS;
            }
        }
        
        // Default fallback for unknown failure codes
        return FailureType.UNKNOWN;
    }

    public enum FailureType {
        NONE, SYSTEMIC, BUSINESS, UNKNOWN
    }
}
