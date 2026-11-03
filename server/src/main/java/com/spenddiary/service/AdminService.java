package com.spenddiary.service;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import com.spenddiary.dto.CategoryRequest;
import com.spenddiary.dto.RoleUpdateRequest;
import com.spenddiary.dto.StatusUpdateRequest;
import com.spenddiary.entity.Category;
import com.spenddiary.entity.User;
import com.spenddiary.mapper.AdminMapper;
import com.spenddiary.mapper.CategoryMapper;
import com.spenddiary.mapper.UserMapper;
import com.spenddiary.vo.AdminCategoryVO;
import com.spenddiary.vo.AdminDashboardVO;
import com.spenddiary.vo.AdminUserVO;
import com.spenddiary.vo.DailyStatVO;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
public class AdminService {

    private final AdminMapper adminMapper;
    private final UserMapper userMapper;
    private final CategoryMapper categoryMapper;

    public AdminService(AdminMapper adminMapper, UserMapper userMapper, CategoryMapper categoryMapper) {
        this.adminMapper = adminMapper;
        this.userMapper = userMapper;
        this.categoryMapper = categoryMapper;
    }

    public AdminDashboardVO dashboard() {
        LocalDate today = LocalDate.now();
        LocalDateTime monthStart = today.withDayOfMonth(1).atStartOfDay();
        LocalDateTime monthEnd = monthStart.plusMonths(1);

        Map<String, BigDecimal> sums = adminMapper.sumIncomeExpenseBetween(monthStart, monthEnd);

        Map<String, DailyStatVO> byDate = new LinkedHashMap<>();
        adminMapper.findDailyTrend(today.minusDays(13).atStartOfDay())
                .forEach(d -> byDate.put(d.date(), d));
        List<DailyStatVO> dailyTrend = new ArrayList<>();
        for (int i = 13; i >= 0; i--) {
            String date = today.minusDays(i).toString();
            DailyStatVO stat = byDate.get(date);
            dailyTrend.add(stat != null ? stat : new DailyStatVO(date, BigDecimal.ZERO, BigDecimal.ZERO));
        }

        return new AdminDashboardVO(
                adminMapper.countUsers(),
                adminMapper.countTransactionsBetween(monthStart, monthEnd),
                adminMapper.countTransactionsTotal(),
                sums.getOrDefault("income", BigDecimal.ZERO),
                sums.getOrDefault("expense", BigDecimal.ZERO),
                dailyTrend);
    }

    public List<AdminUserVO> users() {
        return adminMapper.findUsers();
    }

    public AdminUserVO updateRole(Long operatorId, Long userId, RoleUpdateRequest request) {
        if (operatorId.equals(userId)) {
            throw new BizException(ErrorCode.CANNOT_MODIFY_OWN_ROLE);
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        userMapper.updateRole(userId, request.role());
        return adminMapper.findUserById(userId);
    }

    public AdminUserVO updateStatus(Long operatorId, Long userId, StatusUpdateRequest request) {
        if (operatorId.equals(userId)) {
            throw new BizException(ErrorCode.CANNOT_MODIFY_OWN_STATUS);
        }
        User user = userMapper.findById(userId);
        if (user == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        userMapper.updateEnabled(userId, request.enabled());
        return adminMapper.findUserById(userId);
    }

    public List<AdminCategoryVO> categories() {
        return adminMapper.findCategories();
    }

    public AdminCategoryVO createCategory(CategoryRequest request) {
        requireBuiltinNameAvailable(request.name(), null);

        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setBuiltin(true);
        category.setUserId(null);
        category.setSortOrder(0);
        categoryMapper.insert(category);
        return adminMapper.findCategoryById(category.getId());
    }

    public AdminCategoryVO updateCategory(Long id, CategoryRequest request) {
        Category category = categoryMapper.findById(id);
        if (category == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        if (category.isBuiltin()) {
            requireBuiltinNameAvailable(request.name(), id);
        }

        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        categoryMapper.update(category);
        return adminMapper.findCategoryById(id);
    }

    public void deleteCategory(Long id) {
        Category category = categoryMapper.findById(id);
        if (category == null) {
            throw new BizException(ErrorCode.NOT_FOUND);
        }
        if (adminMapper.countUsageByCategoryId(id) > 0) {
            throw new BizException(ErrorCode.CATEGORY_IN_USE);
        }
        categoryMapper.deleteById(id);
    }

    private void requireBuiltinNameAvailable(String name, Long excludeId) {
        if (adminMapper.countByBuiltinNameExcluding(name, excludeId) > 0) {
            throw new BizException(ErrorCode.CATEGORY_NAME_TAKEN);
        }
    }
}
