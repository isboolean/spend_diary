package com.spenddiary.mapper;

import com.spenddiary.entity.Budget;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface BudgetMapper {

    int upsert(Budget budget);

    Budget findByUserIdAndMonth(@Param("userId") Long userId, @Param("month") String month);

    int deleteByUserIdAndMonth(@Param("userId") Long userId, @Param("month") String month);
}
