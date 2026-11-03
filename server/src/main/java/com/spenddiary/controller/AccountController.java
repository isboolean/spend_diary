package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.dto.AccountRequest;
import com.spenddiary.service.AccountService;
import com.spenddiary.vo.AccountVO;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/app/accounts")
public class AccountController {

    private final AccountService accountService;

    public AccountController(AccountService accountService) {
        this.accountService = accountService;
    }

    @GetMapping
    public ApiResponse<List<AccountVO>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(accountService.list(principal.id()));
    }

    @PostMapping
    public ApiResponse<AccountVO> create(@AuthenticationPrincipal UserPrincipal principal,
                                         @Valid @RequestBody AccountRequest request) {
        return ApiResponse.ok(accountService.create(principal.id(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<AccountVO> update(@AuthenticationPrincipal UserPrincipal principal,
                                         @PathVariable Long id,
                                         @Valid @RequestBody AccountRequest request) {
        return ApiResponse.ok(accountService.update(principal.id(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long id) {
        accountService.delete(principal.id(), id);
        return ApiResponse.ok(null);
    }
}
