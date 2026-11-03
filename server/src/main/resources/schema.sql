CREATE TABLE IF NOT EXISTS users (
    id         BIGINT       NOT NULL AUTO_INCREMENT,
    username   VARCHAR(32)  NOT NULL,
    password   VARCHAR(100) NOT NULL,
    nickname   VARCHAR(32)  NOT NULL,
    role       VARCHAR(16)  NOT NULL DEFAULT 'USER',
    enabled    TINYINT(1)   NOT NULL DEFAULT 1,
    created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_users_username (username)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 幂等迁移：老库补 role 列（MySQL 不支持 ADD COLUMN IF NOT EXISTS，用动态 SQL 实现）
SET @role_col_exists = (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'role');
SET @ddl = IF(@role_col_exists = 0,
    'ALTER TABLE users ADD COLUMN role VARCHAR(16) NOT NULL DEFAULT ''USER'' AFTER nickname',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @enabled_col_exists = (SELECT COUNT(*) FROM information_schema.columns
    WHERE table_schema = DATABASE() AND table_name = 'users' AND column_name = 'enabled');
SET @ddl = IF(@enabled_col_exists = 0,
    'ALTER TABLE users ADD COLUMN enabled TINYINT(1) NOT NULL DEFAULT 1 AFTER role',
    'SELECT 1');
PREPARE stmt FROM @ddl;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 若无任何管理员，将最早注册的用户提升为管理员（用会话变量规避 MySQL 1093 限制）
SET @min_user_id = (SELECT MIN(id) FROM users);
SET @admin_count = (SELECT COUNT(*) FROM users WHERE role = 'ADMIN');
UPDATE users
SET role = 'ADMIN'
WHERE id = @min_user_id
  AND @admin_count = 0;

CREATE TABLE IF NOT EXISTS ledgers (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    user_id    BIGINT      NOT NULL,
    name       VARCHAR(32) NOT NULL,
    created_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_ledgers_user (user_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS accounts (
    id         BIGINT         NOT NULL AUTO_INCREMENT,
    ledger_id  BIGINT         NOT NULL,
    name       VARCHAR(32)    NOT NULL,
    type       VARCHAR(16)    NOT NULL,
    balance    DECIMAL(12, 2) NOT NULL DEFAULT 0,
    created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_accounts_ledger (ledger_id)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS categories (
    id         BIGINT      NOT NULL AUTO_INCREMENT,
    name       VARCHAR(16) NOT NULL,
    type       VARCHAR(16) NOT NULL,
    icon       VARCHAR(16) NULL,
    builtin    TINYINT(1)  NOT NULL DEFAULT 0,
    user_id    BIGINT      NULL,
    sort_order INT         NOT NULL DEFAULT 0,
    PRIMARY KEY (id),
    KEY idx_categories_type (type)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS transactions (
    id          BIGINT         NOT NULL AUTO_INCREMENT,
    ledger_id   BIGINT         NOT NULL,
    account_id  BIGINT         NOT NULL,
    category_id BIGINT         NOT NULL,
    type        VARCHAR(16)    NOT NULL,
    amount      DECIMAL(12, 2) NOT NULL,
    occurred_at DATETIME       NOT NULL,
    note        VARCHAR(255)   NULL,
    created_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at  DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_transactions_ledger_time (ledger_id, occurred_at)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

CREATE TABLE IF NOT EXISTS budgets (
    id         BIGINT         NOT NULL AUTO_INCREMENT,
    user_id    BIGINT         NOT NULL,
    month      CHAR(7)        NOT NULL,
    amount     DECIMAL(12, 2) NOT NULL,
    created_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME       NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uk_budgets_user_month (user_id, month)
) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4;

-- 幂等迁移：老种子分类改名/换图标（仅当仍是旧种子值时才更新，不覆盖管理员的自定义修改）
UPDATE categories SET name = '休闲娱乐', icon = '🎤', sort_order = 8 WHERE name = '娱乐' AND builtin = 1;
UPDATE categories SET name = '住房', sort_order = 14 WHERE name = '居住' AND builtin = 1;
UPDATE categories SET name = '学习', sort_order = 16 WHERE name = '教育' AND builtin = 1;
UPDATE categories SET icon = '🚌', sort_order = 3 WHERE name = '交通' AND builtin = 1 AND icon = '🚗';
UPDATE categories SET icon = '🛒', sort_order = 1 WHERE name = '购物' AND builtin = 1 AND icon = '🛍️';
UPDATE categories SET sort_order = 20 WHERE name = '医疗' AND builtin = 1 AND sort_order = 5;
UPDATE categories SET sort_order = 36 WHERE name = '其他支出' AND builtin = 1 AND sort_order = 7;
UPDATE categories SET icon = '💼', sort_order = 37 WHERE name = '工资' AND builtin = 1 AND icon = '💰';
UPDATE categories SET icon = '🪙', sort_order = 41 WHERE name = '奖金' AND builtin = 1 AND icon = '🎁';
UPDATE categories SET sort_order = 42 WHERE name = '理财' AND builtin = 1 AND sort_order = 10;
UPDATE categories SET sort_order = 52 WHERE name = '其他收入' AND builtin = 1 AND sort_order = 11;

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '餐饮', 'EXPENSE', '🍜', 1, 0 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '餐饮' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '购物', 'EXPENSE', '🛒', 1, 1 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '购物' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '日用', 'EXPENSE', '🧻', 1, 2 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '日用' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '交通', 'EXPENSE', '🚌', 1, 3 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '交通' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '蔬菜', 'EXPENSE', '🥕', 1, 4 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '蔬菜' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '水果', 'EXPENSE', '🍉', 1, 5 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '水果' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '零食', 'EXPENSE', '🍟', 1, 6 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '零食' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '运动', 'EXPENSE', '🏋️', 1, 7 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '运动' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '休闲娱乐', 'EXPENSE', '🎤', 1, 8 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '休闲娱乐' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '通讯', 'EXPENSE', '📱', 1, 9 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '通讯' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '生活缴费', 'EXPENSE', '⚡', 1, 10 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '生活缴费' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '服装', 'EXPENSE', '👕', 1, 11 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '服装' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '美容', 'EXPENSE', '💄', 1, 12 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '美容' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '转账', 'EXPENSE', '💳', 1, 13 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '转账' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '住房', 'EXPENSE', '🏠', 1, 14 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '住房' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '首饰', 'EXPENSE', '💍', 1, 15 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '首饰' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '学习', 'EXPENSE', '📚', 1, 16 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '学习' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '旅行', 'EXPENSE', '✈️', 1, 17 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '旅行' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '饮品', 'EXPENSE', '🧋', 1, 18 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '饮品' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '数码', 'EXPENSE', '📷', 1, 19 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '数码' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '医疗', 'EXPENSE', '💊', 1, 20 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '医疗' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '网络虚拟', 'EXPENSE', '🖥️', 1, 21 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '网络虚拟' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '办公', 'EXPENSE', '💼', 1, 22 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '办公' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '孩子', 'EXPENSE', '👶', 1, 23 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '孩子' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '长辈', 'EXPENSE', '👴', 1, 24 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '长辈' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '宠物', 'EXPENSE', '🐾', 1, 25 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '宠物' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '鲜花', 'EXPENSE', '💐', 1, 26 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '鲜花' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '社交', 'EXPENSE', '💬', 1, 27 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '社交' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '追星', 'EXPENSE', '⭐', 1, 28 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '追星' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '亲友', 'EXPENSE', '👥', 1, 29 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '亲友' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '借出', 'EXPENSE', '🤲', 1, 30 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '借出' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '家具家电', 'EXPENSE', '📺', 1, 31 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '家具家电' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '汽车', 'EXPENSE', '🚗', 1, 32 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '汽车' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '维修', 'EXPENSE', '🔧', 1, 33 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '维修' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '烟酒', 'EXPENSE', '🍷', 1, 34 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '烟酒' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '保险', 'EXPENSE', '🛡️', 1, 35 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '保险' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '其他支出', 'EXPENSE', '📦', 1, 36 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '其他支出' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '工资', 'INCOME', '💼', 1, 37 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '工资' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '红包', 'INCOME', '🧧', 1, 38 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '红包' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '收款', 'INCOME', '💴', 1, 39 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '收款' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '兼职', 'INCOME', '⏰', 1, 40 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '兼职' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '奖金', 'INCOME', '🪙', 1, 41 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '奖金' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '理财', 'INCOME', '📈', 1, 42 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '理财' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '卖二手', 'INCOME', '🔄', 1, 43 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '卖二手' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '收礼金', 'INCOME', '💰', 1, 44 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '收礼金' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '退款', 'INCOME', '💸', 1, 45 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '退款' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '收租', 'INCOME', '🏢', 1, 46 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '收租' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '借入', 'INCOME', '👐', 1, 47 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '借入' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '彩票', 'INCOME', '🎫', 1, 48 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '彩票' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '保险理赔', 'INCOME', '🛡️', 1, 49 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '保险理赔' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '分红', 'INCOME', '🥧', 1, 50 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '分红' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '报销', 'INCOME', '🧾', 1, 51 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '报销' AND builtin = 1);

INSERT INTO categories (name, type, icon, builtin, sort_order)
SELECT '其他收入', 'INCOME', '💵', 1, 52 WHERE NOT EXISTS (SELECT 1 FROM categories WHERE name = '其他收入' AND builtin = 1);
