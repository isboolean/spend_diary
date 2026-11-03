package com.spenddiary.vo;

import com.spenddiary.entity.enums.UserRole;

import java.time.LocalDateTime;

public record AdminUserVO(
        Long id,
        String username,
        String nickname,
        UserRole role,
        boolean enabled,
        LocalDateTime createdAt,
        long transactionCount) {
}
