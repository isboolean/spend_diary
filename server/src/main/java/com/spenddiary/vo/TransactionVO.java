package com.spenddiary.vo;

import com.spenddiary.entity.enums.TransactionType;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionVO(
        Long id,
        Long accountId,
        String accountName,
        Long categoryId,
        String categoryName,
        String categoryIcon,
        TransactionType type,
        BigDecimal amount,
        LocalDateTime occurredAt,
        String note) {
}
