package com.fintech.switchmonitor.domain;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface SwitchTransactionRepository extends JpaRepository<SwitchTransaction, Long> {
}
