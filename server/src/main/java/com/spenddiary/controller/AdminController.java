package com.spenddiary.controller;

import com.spenddiary.common.api.ApiResponse;
import com.spenddiary.common.security.UserPrincipal;
import com.spenddiary.dto.CategoryRequest;
import com.spenddiary.dto.RoleUpdateRequest;
import com.spenddiary.dto.StatusUpdateRequest;
import com.spenddiary.service.AdminService;
import com.spenddiary.vo.AdminCategoryVO;
import com.spenddiary.vo.AdminDashboardVO;
import com.spenddiary.vo.AdminUserVO;
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
@RequestMapping("/api/v1/admin")
public class AdminController {

    private final AdminService adminService;

    public AdminController(AdminService adminService) {
        this.adminService = adminService;
    }

    @GetMapping("/dashboard")
    public ApiResponse<AdminDashboardVO> dashboard() {
        return ApiResponse.ok(adminService.dashboard());
    }

    @GetMapping("/users")
    public ApiResponse<List<AdminUserVO>> users() {
        return ApiResponse.ok(adminService.users());
    }

    @PutMapping("/users/{id}/role")
    public ApiResponse<AdminUserVO> updateRole(@AuthenticationPrincipal UserPrincipal principal,
                                               @PathVariable Long id,
                                               @Valid @RequestBody RoleUpdateRequest request) {
        return ApiResponse.ok(adminService.updateRole(principal.id(), id, request));
    }

    @PutMapping("/users/{id}/status")
    public ApiResponse<AdminUserVO> updateStatus(@AuthenticationPrincipal UserPrincipal principal,
                                                 @PathVariable Long id,
                                                 @Valid @RequestBody StatusUpdateRequest request) {
        return ApiResponse.ok(adminService.updateStatus(principal.id(), id, request));
    }

    @GetMapping("/categories")
    public ApiResponse<List<AdminCategoryVO>> categories() {
        return ApiResponse.ok(adminService.categories());
    }

    @PostMapping("/categories")
    public ApiResponse<AdminCategoryVO> createCategory(@Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(adminService.createCategory(request));
    }

    @PutMapping("/categories/{id}")
    public ApiResponse<AdminCategoryVO> updateCategory(@PathVariable Long id,
                                                       @Valid @RequestBody CategoryRequest request) {
        return ApiResponse.ok(adminService.updateCategory(id, request));
    }

    @DeleteMapping("/categories/{id}")
    public ApiResponse<Void> deleteCategory(@PathVariable Long id) {
        adminService.deleteCategory(id);
        return ApiResponse.ok(null);
    }
}
