package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.service.StatisticsService;
import com.spenddiary.vo.MonthlyStatisticsVO;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@Validated
@RestController
@RequestMapping("/api/v1/app/statistics")
public class StatisticsController {

    private final StatisticsService statisticsService;

    public StatisticsController(StatisticsService statisticsService) {
        this.statisticsService = statisticsService;
    }

    @GetMapping("/monthly")
    public ApiResponse<MonthlyStatisticsVO> monthly(
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestParam @NotBlank(message = "不能为空")
            @Pattern(regexp = "\\d{4}-\\d{2}", message = "格式需为 yyyy-MM") String month) {
        return ApiResponse.ok(statisticsService.monthly(principal.id(), month));
    }
}
