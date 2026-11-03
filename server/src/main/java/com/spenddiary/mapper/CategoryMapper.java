package com.spenddiary.mapper;

import com.spenddiary.entity.Category;
import org.apache.ibatis.annotations.Mapper;

import java.util.List;

@Mapper
public interface CategoryMapper {

    List<Category> findByBuiltinTrue();

    List<Category> findByUserIdOrBuiltinTrue(Long userId);

    Category findById(Long id);

    int insert(Category category);

    int update(Category category);

    int deleteById(Long id);
}
