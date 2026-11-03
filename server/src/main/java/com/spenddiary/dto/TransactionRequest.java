package com.spenddiary.dto;

import com.spenddiary.entity.enums.TransactionType;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDateTime;

public record TransactionRequest(
        @NotNull(message = "账户不能为空")
        Long accountId,

        @NotNull(message = "分类不能为空")
        Long categoryId,

        @NotNull(message = "类型不能为空")
        TransactionType type,

        @NotNull(message = "金额不能为空")
        @DecimalMin(value = "0.01", message = "金额必须大于 0")
        BigDecimal amount,

        @NotNull(message = "发生时间不能为空")
        LocalDateTime occurredAt,

        @Size(max = 200, message = "备注长度不能超过 200")
        String note) {
}
