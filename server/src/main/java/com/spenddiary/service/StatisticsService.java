package com.spenddiary.service;

import com.spenddiary.entity.Category;
import com.spenddiary.entity.Ledger;
import com.spenddiary.entity.enums.TransactionType;
import com.spenddiary.mapper.CategoryMapper;
import com.spenddiary.mapper.LedgerMapper;
import com.spenddiary.mapper.StatisticsMapper;
import com.spenddiary.vo.CategoryStatVO;
import com.spenddiary.vo.DailyStatVO;
import com.spenddiary.vo.MonthlyStatisticsVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class StatisticsService {

    private final LedgerMapper ledgerMapper;
    private final StatisticsMapper statisticsMapper;
    private final CategoryMapper categoryMapper;

    public StatisticsService(LedgerMapper ledgerMapper, StatisticsMapper statisticsMapper,
                             CategoryMapper categoryMapper) {
        this.ledgerMapper = ledgerMapper;
        this.statisticsMapper = statisticsMapper;
        this.categoryMapper = categoryMapper;
    }

    public MonthlyStatisticsVO monthly(Long userId, String month) {
        BigDecimal zero = BigDecimal.ZERO;
        List<Long> ledgerIds = ledgerIdsOf(userId);
        if (ledgerIds.isEmpty()) {
            return new MonthlyStatisticsVO(month, zero, zero, zero, List.of(), List.of());
        }

        LocalDateTime start = LocalDate.parse(month + "-01").atStartOfDay();
        LocalDateTime end = start.plusMonths(1);

        BigDecimal totalIncome = zero;
        BigDecimal totalExpense = zero;
        for (Map<String, Object> row : statisticsMapper.sumByType(ledgerIds, start, end)) {
            BigDecimal total = asDecimal(row.get("total"));
            if (TransactionType.INCOME.name().equals(row.get("type"))) {
                totalIncome = total;
            } else if (TransactionType.EXPENSE.name().equals(row.get("type"))) {
                totalExpense = total;
            }
        }

        Map<Long, Category> categoryMap = categoryMapper.findByUserIdOrBuiltinTrue(userId).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));

        List<CategoryStatVO> byCategory = statisticsMapper.sumByCategory(ledgerIds, start, end).stream()
                .map(row -> {
                    Long categoryId = ((Number) row.get("categoryId")).longValue();
                    Category category = categoryMap.get(categoryId);
                    return new CategoryStatVO(
                            categoryId,
                            category != null ? category.getName() : "已删除分类",
                            category != null ? category.getIcon() : "",
                            TransactionType.valueOf(String.valueOf(row.get("type"))),
                            asDecimal(row.get("total")));
                })
                .toList();

        Map<String, DailyStatVO> dailyMap = new LinkedHashMap<>();
        for (Map<String, Object> row : statisticsMapper.sumDaily(ledgerIds, start, end)) {
            String date = String.valueOf(row.get("date"));
            BigDecimal total = asDecimal(row.get("total"));
            DailyStatVO current = dailyMap.computeIfAbsent(date, d -> new DailyStatVO(d, zero, zero));
            if (TransactionType.INCOME.name().equals(row.get("type"))) {
                dailyMap.put(date, new DailyStatVO(date, total, current.expense()));
            } else if (TransactionType.EXPENSE.name().equals(row.get("type"))) {
                dailyMap.put(date, new DailyStatVO(date, current.income(), total));
            }
        }
        List<DailyStatVO> daily = new ArrayList<>(dailyMap.values());

        return new MonthlyStatisticsVO(
                month,
                totalIncome,
                totalExpense,
                totalIncome.subtract(totalExpense),
                byCategory,
                daily);
    }

    private List<Long> ledgerIdsOf(Long userId) {
        return ledgerMapper.findByUserId(userId).stream().map(Ledger::getId).toList();
    }

    private BigDecimal asDecimal(Object value) {
        return value instanceof BigDecimal bd ? bd : new BigDecimal(String.valueOf(value));
    }
}
