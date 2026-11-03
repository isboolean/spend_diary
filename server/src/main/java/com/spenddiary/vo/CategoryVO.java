package com.spenddiary.vo;

import com.spenddiary.entity.enums.CategoryType;

public record CategoryVO(
        Long id,
        String name,
        CategoryType type,
        String icon,
        boolean builtin) {
}
