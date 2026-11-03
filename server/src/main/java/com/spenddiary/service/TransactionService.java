package com.spenddiary.service;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import com.spenddiary.dto.TransactionRequest;
import com.spenddiary.entity.Account;
import com.spenddiary.entity.Category;
import com.spenddiary.entity.Ledger;
import com.spenddiary.entity.Transaction;
import com.spenddiary.entity.enums.TransactionType;
import com.spenddiary.mapper.AccountMapper;
import com.spenddiary.mapper.CategoryMapper;
import com.spenddiary.mapper.LedgerMapper;
import com.spenddiary.mapper.TransactionMapper;
import com.spenddiary.vo.TransactionVO;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
public class TransactionService {

    private final TransactionMapper transactionMapper;
    private final AccountMapper accountMapper;
    private final LedgerMapper ledgerMapper;
    private final CategoryMapper categoryMapper;

    public TransactionService(TransactionMapper transactionMapper, AccountMapper accountMapper,
                              LedgerMapper ledgerMapper, CategoryMapper categoryMapper) {
        this.transactionMapper = transactionMapper;
        this.accountMapper = accountMapper;
        this.ledgerMapper = ledgerMapper;
        this.categoryMapper = categoryMapper;
    }

    @Transactional
    public TransactionVO create(Long userId, TransactionRequest request) {
        Account account = requireAccount(request.accountId());
        requireOwnedByUser(account, userId);
        Category category = requireCategory(request.categoryId(), userId);

        Transaction transaction = new Transaction();
        transaction.setLedgerId(account.getLedgerId());
        transaction.setAccountId(account.getId());
        transaction.setCategoryId(category.getId());
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setOccurredAt(request.occurredAt());
        transaction.setNote(request.note());
        transactionMapper.insert(transaction);

        accountMapper.updateBalance(account.getId(), signedAmount(request.type(), request.amount()));

        return toVO(transaction, account, category);
    }

    @Transactional
    public TransactionVO update(Long userId, Long id, TransactionRequest request) {
        Transaction transaction = transactionMapper.findById(id);
        if (transaction == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        requireOwnedByUser(requireAccount(transaction.getAccountId()), userId);

        Account newAccount = requireAccount(request.accountId());
        requireOwnedByUser(newAccount, userId);
        Category newCategory = requireCategory(request.categoryId(), userId);

        accountMapper.updateBalance(transaction.getAccountId(),
                signedAmount(transaction.getType(), transaction.getAmount()).negate());
        accountMapper.updateBalance(newAccount.getId(), signedAmount(request.type(), request.amount()));

        transaction.setLedgerId(newAccount.getLedgerId());
        transaction.setAccountId(newAccount.getId());
        transaction.setCategoryId(newCategory.getId());
        transaction.setType(request.type());
        transaction.setAmount(request.amount());
        transaction.setOccurredAt(request.occurredAt());
        transaction.setNote(request.note());
        transactionMapper.update(transaction);

        return toVO(transaction, newAccount, newCategory);
    }

    @Transactional
    public void delete(Long userId, Long id) {
        Transaction transaction = transactionMapper.findById(id);
        if (transaction == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        requireOwnedByUser(requireAccount(transaction.getAccountId()), userId);

        accountMapper.updateBalance(transaction.getAccountId(),
                signedAmount(transaction.getType(), transaction.getAmount()).negate());
        transactionMapper.deleteById(id);
    }

    public List<TransactionVO> list(Long userId, String month, TransactionType type,
                                    Long categoryId, Long accountId, String keyword) {
        List<Ledger> ledgers = ledgerMapper.findByUserId(userId);
        if (ledgers.isEmpty()) {
            return List.of();
        }
        List<Long> ledgerIds = ledgers.stream().map(Ledger::getId).toList();

        LocalDateTime start = LocalDate.parse(month + "-01").atStartOfDay();
        List<Transaction> transactions = transactionMapper.findByLedgerIdsBetween(
                ledgerIds, start, start.plusMonths(1), type, categoryId, accountId, keyword);
        if (transactions.isEmpty()) {
            return List.of();
        }

        Map<Long, Account> accountMap = accountMapper.findByLedgerIds(ledgerIds).stream()
                .collect(Collectors.toMap(Account::getId, Function.identity()));
        Map<Long, Category> categoryMap = categoryMapper.findByUserIdOrBuiltinTrue(userId).stream()
                .collect(Collectors.toMap(Category::getId, Function.identity()));

        return transactions.stream()
                .map(t -> toVO(t, accountMap.get(t.getAccountId()), categoryMap.get(t.getCategoryId())))
                .toList();
    }

    private Account requireAccount(Long accountId) {
        Account account = accountMapper.findById(accountId);
        if (account == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        return account;
    }

    private void requireOwnedByUser(Account account, Long userId) {
        Ledger ledger = ledgerMapper.findById(account.getLedgerId());
        if (ledger == null || !userId.equals(ledger.getUserId())) {
            throw new BizException(ErrorCode.FORBIDDEN);
        }
    }

    private Category requireCategory(Long categoryId, Long userId) {
        Category category = categoryMapper.findById(categoryId);
        if (category == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        if (!category.isBuiltin() && !userId.equals(category.getUserId())) {
            throw new BizException(ErrorCode.FORBIDDEN);
        }
        return category;
    }

    private BigDecimal signedAmount(TransactionType type, BigDecimal amount) {
        return type == TransactionType.EXPENSE ? amount.negate() : amount;
    }

    private TransactionVO toVO(Transaction t, Account account, Category category) {
        return new TransactionVO(
                t.getId(),
                t.getAccountId(),
                account != null ? account.getName() : "已删除账户",
                t.getCategoryId(),
                category != null ? category.getName() : "已删除分类",
                category != null ? category.getIcon() : "",
                t.getType(),
                t.getAmount(),
                t.getOccurredAt(),
                t.getNote());
    }
}
