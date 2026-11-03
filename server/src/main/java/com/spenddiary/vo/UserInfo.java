package com.spenddiary.vo;

import com.spenddiary.entity.enums.UserRole;

public record UserInfo(Long id, String username, String nickname, UserRole role) {
}
