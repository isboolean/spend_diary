package com.spenddiary.common.exception;

public enum ErrorCode {

    BAD_REQUEST(400, "请求参数错误"),
    UNAUTHORIZED(401, "未登录或登录已过期"),
    FORBIDDEN(403, "没有操作权限"),
    NOT_FOUND(404, "资源不存在"),
    INTERNAL_ERROR(500, "服务器内部错误"),

    USERNAME_TAKEN(1001, "用户名已被注册"),
    BAD_CREDENTIALS(1002, "用户名或密码错误"),
    CATEGORY_NAME_TAKEN(1003, "分类名称已存在"),
    CATEGORY_IN_USE(1004, "该分类下已有账单，不能删除"),
    ACCOUNT_IN_USE(1005, "该账户下已有账单，不能删除"),
    ACCOUNT_LAST_ONE(1006, "至少保留一个账户"),
    CANNOT_MODIFY_OWN_ROLE(1007, "不能修改自己的角色"),
    USER_DISABLED(1008, "该账号已被禁用"),
    CANNOT_MODIFY_OWN_STATUS(1009, "不能修改自己的账号状态");

    private final int code;
    private final String message;

    ErrorCode(int code, String message) {
        this.code = code;
        this.message = message;
    }

    public int code() {
        return code;
    }

    public String message() {
        return message;
    }
}
