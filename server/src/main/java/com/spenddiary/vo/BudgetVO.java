package com.spenddiary.vo;

import java.math.BigDecimal;

public record BudgetVO(
        String month,
        BigDecimal amount,
        BigDecimal spent,
        BigDecimal remaining,
        boolean overBudget) {
}
