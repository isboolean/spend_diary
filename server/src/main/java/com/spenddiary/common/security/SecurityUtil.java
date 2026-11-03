package com.spenddiary.common.security;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

public final class SecurityUtil {

    private SecurityUtil() {
    }

    public static Long currentUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.getPrincipal() instanceof UserPrincipal principal) {
            return principal.id();
        }
        throw new BizException(ErrorCode.UNAUTHORIZED);
    }
}
