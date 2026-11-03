package com.spenddiary.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;

public record BudgetRequest(
        @NotBlank(message = "不能为空")
        @Pattern(regexp = "\\d{4}-\\d{2}", message = "格式需为 yyyy-MM")
        String month,

        @NotNull(message = "金额不能为空")
        @DecimalMin(value = "0.01", message = "金额必须大于 0")
        BigDecimal amount) {
}
