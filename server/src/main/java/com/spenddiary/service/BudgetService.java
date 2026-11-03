package com.spenddiary.service;

import com.spenddiary.dto.BudgetRequest;
import com.spenddiary.entity.Budget;
import com.spenddiary.mapper.BudgetMapper;
import com.spenddiary.vo.BudgetVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
public class BudgetService {

    private final BudgetMapper budgetMapper;
    private final StatisticsService statisticsService;

    public BudgetService(BudgetMapper budgetMapper, StatisticsService statisticsService) {
        this.budgetMapper = budgetMapper;
        this.statisticsService = statisticsService;
    }

    public BudgetVO get(Long userId, String month) {
        Budget budget = budgetMapper.findByUserIdAndMonth(userId, month);
        BigDecimal spent = statisticsService.monthly(userId, month).totalExpense();
        if (budget == null) {
            return new BudgetVO(month, null, spent, null, false);
        }
        BigDecimal amount = budget.getAmount();
        return new BudgetVO(month, amount, spent, amount.subtract(spent), spent.compareTo(amount) > 0);
    }

    public BudgetVO upsert(Long userId, BudgetRequest request) {
        Budget budget = new Budget();
        budget.setUserId(userId);
        budget.setMonth(request.month());
        budget.setAmount(request.amount());
        budgetMapper.upsert(budget);
        return get(userId, request.month());
    }

    public void delete(Long userId, String month) {
        budgetMapper.deleteByUserIdAndMonth(userId, month);
    }
}
