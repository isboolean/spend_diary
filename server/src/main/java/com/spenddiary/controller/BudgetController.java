package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.dto.BudgetRequest;
import com.spenddiary.service.BudgetService;
import com.spenddiary.vo.BudgetVO;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/app/budgets")
public class BudgetController {

    private final BudgetService budgetService;

    public BudgetController(BudgetService budgetService) {
        this.budgetService = budgetService;
    }

    @GetMapping
    public ApiResponse<BudgetVO> get(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @NotBlank(message = "不能为空")
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "格式需为 yyyy-MM") String month) {
        return ApiResponse.ok(budgetService.get(principal.id(), month));
    }

    @PutMapping
    public ApiResponse<BudgetVO> upsert(@AuthenticationPrincipal UserPrincipal principal,
                                        @Valid @RequestBody BudgetRequest request) {
        return ApiResponse.ok(budgetService.upsert(principal.id(), request));
    }

    @DeleteMapping
    public ApiResponse<Void> delete(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @NotBlank(message = "不能为空")
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "格式需为 yyyy-MM") String month) {
        budgetService.delete(principal.id(), month);
        return ApiResponse.ok(null);
    }
}
