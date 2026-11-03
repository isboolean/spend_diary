package com.spenddiary.dto;

import com.spenddiary.entity.enums.AccountType;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

public record AccountRequest(
        @NotBlank(message = "账户名称不能为空")
        @Size(max = 16, message = "账户名称不能超过 16 字")
        String name,

        @NotNull(message = "账户类型不能为空")
        AccountType type,

        @Digits(integer = 10, fraction = 2, message = "余额最多两位小数")
        BigDecimal initialBalance) {
}
