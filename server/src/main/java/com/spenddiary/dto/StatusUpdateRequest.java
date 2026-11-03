package com.spenddiary.dto;

import jakarta.validation.constraints.NotNull;

public record StatusUpdateRequest(
        @NotNull(message = "状态不能为空")
        Boolean enabled) {
}
