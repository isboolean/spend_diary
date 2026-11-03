package com.spenddiary.mapper;

import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Mapper
public interface StatisticsMapper {

    List<Map<String, Object>> sumByType(@Param("ledgerIds") List<Long> ledgerIds,
                                        @Param("start") LocalDateTime start,
                                        @Param("end") LocalDateTime end);

    List<Map<String, Object>> sumByCategory(@Param("ledgerIds") List<Long> ledgerIds,
                                            @Param("start") LocalDateTime start,
                                            @Param("end") LocalDateTime end);

    List<Map<String, Object>> sumDaily(@Param("ledgerIds") List<Long> ledgerIds,
                                       @Param("start") LocalDateTime start,
                                       @Param("end") LocalDateTime end);
}
