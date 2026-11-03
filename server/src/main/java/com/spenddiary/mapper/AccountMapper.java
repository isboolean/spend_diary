package com.spenddiary.mapper;

import com.spenddiary.entity.Account;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.math.BigDecimal;
import java.util.List;

@Mapper
public interface AccountMapper {

    int insert(Account account);

    List<Account> findByLedgerId(Long ledgerId);

    List<Account> findByLedgerIds(@Param("ledgerIds") List<Long> ledgerIds);

    Account findById(Long id);

    int update(Account account);

    int deleteById(Long id);

    int updateBalance(@Param("id") Long id, @Param("delta") BigDecimal delta);
}
