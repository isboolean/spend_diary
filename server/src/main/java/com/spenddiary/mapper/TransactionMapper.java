package com.spenddiary.mapper;

import com.spenddiary.entity.Transaction;
import com.spenddiary.entity.enums.TransactionType;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.time.LocalDateTime;
import java.util.List;

@Mapper
public interface TransactionMapper {

    int insert(Transaction transaction);

    Transaction findById(Long id);

    List<Transaction> findByLedgerId(Long ledgerId);

    List<Transaction> findByLedgerIdsBetween(@Param("ledgerIds") List<Long> ledgerIds,
                                             @Param("start") LocalDateTime start,
                                             @Param("end") LocalDateTime end,
                                             @Param("type") TransactionType type,
                                             @Param("categoryId") Long categoryId,
                                             @Param("accountId") Long accountId,
                                             @Param("keyword") String keyword);

    int update(Transaction transaction);

    int deleteById(Long id);

    int countByCategoryId(Long categoryId);

    int countByAccountId(Long accountId);
}
