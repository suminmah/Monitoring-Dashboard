package com.fintech.switchmonitor.kafka;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.fintech.switchmonitor.domain.SwitchTransaction;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.Instant;
import java.util.Random;
import java.util.UUID;

@Service
public class MockTransactionProducer {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;
    private final Random random = new Random();

    public MockTransactionProducer(KafkaTemplate<String, String> kafkaTemplate) {
        this.kafkaTemplate = kafkaTemplate;
        this.objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());
    }

    // Generate ~10-20 TPS
    @Scheduled(fixedRate = 50)
    public void generateMockTraffic() {
        SwitchTransaction tx = new SwitchTransaction();
        tx.setTransactionId(UUID.randomUUID().toString());
        tx.setRrn(String.valueOf(100000000000L + random.nextInt(900000000)));
        tx.setPanMasked("411111******" + (1000 + random.nextInt(9000)));
        tx.setAmount(10.0 + (random.nextDouble() * 500));
        tx.setChannel(random.nextBoolean() ? "POS" : "ATM");
        String[] institutions = {"Bank_A", "Bank_B", "Wallet_C", "PSP_D"};
        String[] services = {"IBFT", "QR_MERCHANT", "NPCI_CROSSBORDER", "ALIPAY_INBOUND"};
        String[] gateways = {"DOMESTIC_HUB", "UPI_GATEWAY", "ALIPAY_NET"};
        String[] settlement = {"INSTANT", "BATCH", "ON_REQUEST"};
        String[] subChannels = {"MOBILE_APP", "USSD", "WEB", "POS"};

        tx.setInstitutionId(institutions[random.nextInt(institutions.length)]);
        tx.setServiceType(services[random.nextInt(services.length)]);
        tx.setGateway(gateways[random.nextInt(gateways.length)]);
        tx.setSettlementType(settlement[random.nextInt(settlement.length)]);
        tx.setSubChannel(subChannels[random.nextInt(subChannels.length)]);
        
        int chance = random.nextInt(100);
        if (chance < 85) {
            tx.setStatus(SwitchTransaction.Status.COMPLETED);
            tx.setResponseCode("00");
            tx.setLatencyMs(50L + random.nextInt(150));
        } else if (chance < 95) {
            tx.setStatus(SwitchTransaction.Status.FAILED);
            // Business errors: 51=Insufficient Funds, 14=Invalid Card
            tx.setResponseCode(random.nextBoolean() ? "51" : "14"); 
            tx.setLatencyMs(20L + random.nextInt(80));
        } else {
            tx.setStatus(SwitchTransaction.Status.TIMEOUT);
            // Systemic errors: 91=Switch Inoperative, 96=System Malfunction
            tx.setResponseCode(random.nextBoolean() ? "91" : "96"); 
            tx.setLatencyMs(2000L + random.nextInt(3000));
        }
        
        tx.setTimestamp(Instant.now());

        try {
            String json = objectMapper.writeValueAsString(tx);
            String txId = tx.getTransactionId();
            if (json != null && txId != null) {
                kafkaTemplate.send("switch-transactions", txId, json);
            }
        } catch (JsonProcessingException e) {
            e.printStackTrace();
        }
    }
}
