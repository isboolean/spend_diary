package com.spenddiary.service;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import com.spenddiary.dto.AccountRequest;
import com.spenddiary.entity.Account;
import com.spenddiary.entity.Ledger;
import com.spenddiary.mapper.AccountMapper;
import com.spenddiary.mapper.LedgerMapper;
import com.spenddiary.mapper.TransactionMapper;
import com.spenddiary.vo.AccountVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class AccountService {

    private final LedgerMapper ledgerMapper;
    private final AccountMapper accountMapper;
    private final TransactionMapper transactionMapper;

    public AccountService(LedgerMapper ledgerMapper, AccountMapper accountMapper,
                          TransactionMapper transactionMapper) {
        this.ledgerMapper = ledgerMapper;
        this.accountMapper = accountMapper;
        this.transactionMapper = transactionMapper;
    }

    public List<AccountVO> list(Long userId) {
        List<Ledger> ledgers = ledgerMapper.findByUserId(userId);
        if (ledgers.isEmpty()) {
            return List.of();
        }
        List<Long> ledgerIds = ledgers.stream().map(Ledger::getId).toList();
        return accountMapper.findByLedgerIds(ledgerIds).stream()
                .map(a -> new AccountVO(a.getId(), a.getLedgerId(), a.getName(), a.getType(), a.getBalance()))
                .toList();
    }

    @Transactional
    public AccountVO create(Long userId, AccountRequest request) {
        Ledger ledger = ledgerMapper.findByUserId(userId).get(0);

        Account account = new Account();
        account.setLedgerId(ledger.getId());
        account.setName(request.name().trim());
        account.setType(request.type());
        account.setBalance(request.initialBalance() == null ? BigDecimal.ZERO : request.initialBalance());
        accountMapper.insert(account);

        return new AccountVO(account.getId(), account.getLedgerId(), account.getName(),
                account.getType(), account.getBalance());
    }

    @Transactional
    public AccountVO update(Long userId, Long id, AccountRequest request) {
        Account account = requireOwnedByUser(id, userId);

        account.setName(request.name().trim());
        account.setType(request.type());
        accountMapper.update(account);

        return new AccountVO(account.getId(), account.getLedgerId(), account.getName(),
                account.getType(), account.getBalance());
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Account account = requireOwnedByUser(id, userId);

        if (transactionMapper.countByAccountId(id) > 0) {
            throw new BizException(ErrorCode.ACCOUNT_IN_USE);
        }
        if (accountMapper.findByLedgerId(account.getLedgerId()).size() <= 1) {
            throw new BizException(ErrorCode.ACCOUNT_LAST_ONE);
        }
        accountMapper.deleteById(id);
    }

    private Account requireOwnedByUser(Long accountId, Long userId) {
        Account account = accountMapper.findById(accountId);
        if (account == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        Ledger ledger = ledgerMapper.findById(account.getLedgerId());
        if (ledger == null || !userId.equals(ledger.getUserId())) {
            throw new BizException(ErrorCode.FORBIDDEN);
        }
        return account;
    }
}
