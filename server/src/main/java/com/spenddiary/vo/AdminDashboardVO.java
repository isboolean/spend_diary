package com.spenddiary.vo;

import java.math.BigDecimal;
import java.util.List;

public record AdminDashboardVO(
        long userCount,
        long transactionMonthCount,
        long transactionTotalCount,
        BigDecimal monthIncome,
        BigDecimal monthExpense,
        List<DailyStatVO> dailyTrend) {
}
