package com.spenddiary.vo;

import com.spenddiary.entity.enums.CategoryType;

public record AdminCategoryVO(
        Long id,
        String name,
        CategoryType type,
        String icon,
        boolean builtin,
        String ownerUsername,
        long usageCount) {
}
