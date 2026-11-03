package com.spenddiary.mapper;

import com.spenddiary.entity.Ledger;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface LedgerMapper {

    int insert(Ledger ledger);

    List<Ledger> findByUserId(Long userId);

    Ledger findById(Long id);
}
