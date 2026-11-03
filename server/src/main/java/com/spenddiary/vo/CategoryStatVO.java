package com.spenddiary.vo;

import com.spenddiary.entity.enums.TransactionType;

import java.math.BigDecimal;

public record CategoryStatVO(
        Long categoryId,
        String categoryName,
        String categoryIcon,
        TransactionType type,
        BigDecimal amount) {
}
