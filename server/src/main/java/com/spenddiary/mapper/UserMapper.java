package com.spenddiary.mapper;

import com.spenddiary.entity.User;
import com.spenddiary.entity.enums.UserRole;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

@Mapper
public interface UserMapper {

    int insert(User user);

    User findByUsername(String username);

    int countByUsername(String username);

    User findById(Long id);

    long count();

    int updateRole(@Param("id") Long id, @Param("role") UserRole role);

    int updateEnabled(@Param("id") Long id, @Param("enabled") boolean enabled);
}
