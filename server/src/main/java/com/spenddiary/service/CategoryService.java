package com.spenddiary.service;

import com.spenddiary.common.exception.BizException;
import com.spenddiary.common.exception.ErrorCode;
import com.spenddiary.dto.CategoryRequest;
import com.spenddiary.entity.Category;
import com.spenddiary.mapper.CategoryMapper;
import com.spenddiary.mapper.TransactionMapper;
import com.spenddiary.vo.CategoryVO;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryMapper categoryMapper;
    private final TransactionMapper transactionMapper;

    public CategoryService(CategoryMapper categoryMapper, TransactionMapper transactionMapper) {
        this.categoryMapper = categoryMapper;
        this.transactionMapper = transactionMapper;
    }

    public List<CategoryVO> list(Long userId) {
        return categoryMapper.findByUserIdOrBuiltinTrue(userId).stream()
                .map(this::toVO)
                .toList();
    }

    public CategoryVO create(Long userId, CategoryRequest request) {
        requireNameAvailable(userId, request.name(), null);

        Category category = new Category();
        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        category.setBuiltin(false);
        category.setUserId(userId);
        category.setSortOrder(0);
        categoryMapper.insert(category);
        return toVO(category);
    }

    public CategoryVO update(Long userId, Long id, CategoryRequest request) {
        Category category = requireOwnCategory(userId, id);
        requireNameAvailable(userId, request.name(), id);

        category.setName(request.name());
        category.setType(request.type());
        category.setIcon(request.icon());
        categoryMapper.update(category);
        return toVO(category);
    }

    public void delete(Long userId, Long id) {
        requireOwnCategory(userId, id);
        if (transactionMapper.countByCategoryId(id) > 0) {
            throw new BizException(ErrorCode.CATEGORY_IN_USE);
        }
        categoryMapper.deleteById(id);
    }

    private Category requireOwnCategory(Long userId, Long id) {
        Category category = categoryMapper.findById(id);
        if (category == null || category.isBuiltin() || !userId.equals(category.getUserId())) {
            throw new BizException(category != null && category.isBuiltin()
                    ? ErrorCode.FORBIDDEN
                    : ErrorCode.NOT_FOUND);
        }
        return category;
    }

    private void requireNameAvailable(Long userId, String name, Long excludeId) {
        boolean taken = categoryMapper.findByUserIdOrBuiltinTrue(userId).stream()
                .anyMatch(c -> c.getName().equals(name) && !c.getId().equals(excludeId));
        if (taken) {
            throw new BizException(ErrorCode.CATEGORY_NAME_TAKEN);
        }
    }

    private CategoryVO toVO(Category c) {
        return new CategoryVO(c.getId(), c.getName(), c.getType(), c.getIcon(), c.isBuiltin());
    }
}
