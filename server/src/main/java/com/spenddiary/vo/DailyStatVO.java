package com.spenddiary.vo;

import java.math.BigDecimal;

public record DailyStatVO(
        String date,
        BigDecimal income,
        BigDecimal expense) {
}
