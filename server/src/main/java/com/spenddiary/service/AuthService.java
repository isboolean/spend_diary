package com.spenddiary.service;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import com.spenddiary.common.security.JwtService;
import com.spenddiary.dto.LoginRequest;
import com.spenddiary.dto.RegisterRequest;
import com.spenddiary.entity.Account;
import com.spenddiary.entity.Ledger;
import com.spenddiary.entity.User;
import com.spenddiary.entity.enums.AccountType;
import com.spenddiary.entity.enums.UserRole;
import com.spenddiary.mapper.AccountMapper;
import com.spenddiary.mapper.LedgerMapper;
import com.spenddiary.mapper.UserMapper;
import com.spenddiary.vo.AuthResponse;
import com.spenddiary.vo.UserInfo;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;

@Service
public class AuthService {

    private final UserMapper userMapper;
    private final LedgerMapper ledgerMapper;
    private final AccountMapper accountMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(UserMapper userMapper, LedgerMapper ledgerMapper,
                       AccountMapper accountMapper, PasswordEncoder passwordEncoder,
                       JwtService jwtService) {
        this.userMapper = userMapper;
        this.ledgerMapper = ledgerMapper;
        this.accountMapper = accountMapper;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userMapper.countByUsername(request.username()) > 0) {
            throw new BizException(ErrorCode.USERNAME_TAKEN);
        }
        User user = new User();
        user.setUsername(request.username());
        user.setPassword(passwordEncoder.encode(request.password()));
        user.setNickname(StringUtils.hasText(request.nickname()) ? request.nickname() : request.username());
        user.setRole(userMapper.count() == 0 ? UserRole.ADMIN : UserRole.USER);
        user.setEnabled(true);
        userMapper.insert(user);

        Ledger ledger = new Ledger();
        ledger.setUserId(user.getId());
        ledger.setName("默认账本");
        ledgerMapper.insert(ledger);

        Account account = new Account();
        account.setLedgerId(ledger.getId());
        account.setName("现金");
        account.setType(AccountType.CASH);
        account.setBalance(BigDecimal.ZERO);
        accountMapper.insert(account);

        return buildAuthResponse(user);
    }

    public AuthResponse login(LoginRequest request) {
        User user = userMapper.findByUsername(request.username());
        if (user == null || !passwordEncoder.matches(request.password(), user.getPassword())) {
            throw new BizException(ErrorCode.BAD_CREDENTIALS);
        }
        if (!user.isEnabled()) {
            throw new BizException(ErrorCode.USER_DISABLED);
        }
        return buildAuthResponse(user);
    }

    public UserInfo me(Long userId) {
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(ErrorCode.UNAUTHORIZED);
        }
        return toUserInfo(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        return new AuthResponse(
                jwtService.generate(user.getId(), user.getUsername(), user.getRole()),
                toUserInfo(user));
    }

    private UserInfo toUserInfo(User user) {
        return new UserInfo(user.getId(), user.getUsername(), user.getNickname(), user.getRole());
    }
}
