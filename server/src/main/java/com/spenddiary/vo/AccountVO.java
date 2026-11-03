package com.spenddiary.vo;

import com.spenddiary.entity.enums.AccountType;

import java.math.BigDecimal;

public record AccountVO(
        Long id,
        Long ledgerId,
        String name,
        AccountType type,
        BigDecimal balance) {
}
