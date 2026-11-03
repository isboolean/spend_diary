package com.spenddiary.vo;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyStatisticsVO(
        String month,
        BigDecimal totalIncome,
        BigDecimal totalExpense,
        BigDecimal balance,
        List<CategoryStatVO> byCategory,
        List<DailyStatVO> daily) {
}
