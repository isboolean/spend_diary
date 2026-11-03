package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.dto.CategoryRequest;
import com.spenddiary.service.CategoryService;
import com.spenddiary.vo.CategoryVO;
import jakarta.validation.Valid;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/v1/app/categories")
public class CategoryController {

    private final CategoryService categoryService;

    public CategoryController(CategoryService categoryService) {
        this.categoryService = categoryService;
    }

    @GetMapping
    public ApiResponse<List<CategoryVO>> list(@AuthenticationPrincipal UserPrincipal principal) {
        return ApiResponse.ok(categoryService.list(principal.id()));
    }

    @PostMapping
    public ApiResponse<CategoryVO> create(@AuthenticationPrincipal UserPrincipal principal,
                                          @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.create(principal.id(), request));
    }

    @PutMapping("/{id}")
    public ApiResponse<CategoryVO> update(@AuthenticationPrincipal UserPrincipal principal,
                                          @PathVariable Long id,
                                          @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(categoryService.update(principal.id(), id, request));
    }

    @DeleteMapping("/{id}")
    public ApiResponse<Void> delete(@AuthenticationPrincipal UserPrincipal principal,
                                    @PathVariable Long id) {
        categoryService.delete(principal.id(), id);
        return ApiResponse.ok(null);
    }
}
