package com.spenddiary.dto;

import com.spenddiary.entity.enums.UserRole;
import jakarta.validation.constraints.NotNull;

public record RoleUpdateRequest(
        @NotNull(message = "角色不能为空")
        UserRole role) {
}
