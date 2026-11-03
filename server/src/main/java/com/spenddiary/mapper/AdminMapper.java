package com.spenddiary.mapper;

import com.spenddiary.vo.AdminCategoryVO;
import com.spenddiary.vo.AdminUserVO;
import com.spenddiary.vo.DailyStatVO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface AdminMapper {

    long countUsers();

    long countTransactionsTotal();

    long countTransactionsBetween(@Param("start") LocalDateTime start, @Param("end") LocalDateTime end);

    Map<String, BigDecimal> sumIncomeExpenseBetween(@Param("start") LocalDateTime start,
                                                    @Param("end") LocalDateTime end);

    List<DailyStatVO> findDailyTrend(@Param("start") LocalDateTime start);

    List<AdminUserVO> findUsers();

    AdminUserVO findUserById(Long id);

    List<AdminCategoryVO> findCategories();

    AdminCategoryVO findCategoryById(Long id);

    int countByBuiltinNameExcluding(@Param("name") String name, @Param("excludeId") Long excludeId);

    long countUsageByCategoryId(Long categoryId);
}
