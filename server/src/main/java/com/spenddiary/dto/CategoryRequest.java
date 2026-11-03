package com.spenddiary.dto;

import com.spenddiary.entity.enums.CategoryType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CategoryRequest(
        @NotBlank(message = "名称不能为空")
        @Size(min = 1, max = 16, message = "名称长度需在 1-16 之间")
        String name,

        @NotNull(message = "类型不能为空")
        CategoryType type,

        @Size(max = 16, message = "图标长度不能超过 16")
        String icon) {
}
