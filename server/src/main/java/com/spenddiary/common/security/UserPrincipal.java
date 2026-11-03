package com.spenddiary.common.security;

import com.spenddiary.entity.enums.UserRole;

public record UserPrincipal(Long id, String username, UserRole role) {
}
