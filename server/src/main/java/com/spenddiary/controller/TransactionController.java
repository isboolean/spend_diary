package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.dto.TransactionRequest;
import com.spenddiary.entity.enums.TransactionType;
import com.spenddiary.service.TransactionService;
import com.spenddiary.vo.TransactionVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@Validated
@RestController
@RequestMapping("/api/v1/app/transactions")
public class TransactionController {

    private final TransactionService transactionService;

    public TransactionController(TransactionService transactionService) {
        this.transactionService = transactionService;
    }

    @PostMapping
    public ApiResponse<TransactionVO> create(@AuthenticationPrincipal UserPrincipal principal,
                                             @Valid @RequestBody TransactionRequest request) {
        return ApiResponse.ok(transactionService.create(principal.id(), request));
    }

    @GetMapping
    public ApiResponse<List<TransactionVO>> list(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @NotBlank(message = "不能为空")
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "格式需为 yyyy-MM") String month,
            @RequestParam(required = false) TransactionType type,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) Long accountId,
            @RequestParam(required = false) String keyword) {
        return ApiResponse.ok(transactionService.list(principal.id(), month, type, categoryId, accountId, keyword));
    }

    @PutMapping("/{id}")
    public ApiResponse<TransactionVO> update(@AuthenticationPrincipal UserPrincipal principal,
                                             @PathVariable Long id,
                                             @Valid @RequestBody TransactionRequest request) {
        return ApiResponse.ok(transactionService.update(principal.id(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long id) {
        transactionService.delete(principal.id(), id);
        return ApiResponse.ok(null);
    }
}
