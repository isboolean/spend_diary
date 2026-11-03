# PC 端功能实施计划

> 对应需求文档：docs/pc-requirements.md ｜ 日期：2026-11-03

## 1. 总体顺序

```
后端（账户 CRUD + 账单筛选参数）→ 后端构建 + 冒烟测试
        ↓
前端（api 扩展 → 首页 → 账户页 → 账单筛选 → 统计图表 → 菜单路由）
        ↓
前端构建 + 浏览器全流程验证
```

前端账单筛选依赖后端新参数，故后端先行。

## 2. 后端改动清单（server/）

| # | 文件 | 改动 |
| --- | --- | --- |
| 1 | `common/exception/ErrorCode.java` | 新增 `ACCOUNT_IN_USE(1005, "该账户下已有账单，不能删除")`、`ACCOUNT_LAST_ONE(1006, "至少保留一个账户")` |
| 2 | `entity/enums/AccountType.java` | 新增 `OTHER` |
| 3 | `dto/AccountRequest.java`（新建） | `name`(@NotBlank @Size(max=16))、`type`(@NotNull)、`initialBalance`(BigDecimal，可空默认 0，@Digits(integer=10,fraction=2)) |
| 4 | `mapper/AccountMapper.java` + `AccountMapper.xml` | 新增 `update(Account)`（name/type）、`deleteById(Long)` |
| 5 | `mapper/TransactionMapper.java` + `TransactionMapper.xml` | 新增 `countByAccountId(Long)`；`findByLedgerIdsBetween` 增加 `categoryId`、`accountId`、`keyword` 参数与 `<if>` 动态条件（keyword → `note LIKE CONCAT('%', #{keyword}, '%')`） |
| 6 | `service/AccountService.java` | 新增 `create`（取用户首个账本；`initialBalance` 空时按 0）、`update`（校验归属；仅 name/type）、`delete`（校验归属；countByAccountId>0 → 1005；该账本账户数=1 → 1006）；复用 `requireOwnedByUser` 风格校验 |
| 7 | `controller/AccountController.java` | 新增 `POST`、`PUT /{id}`、`DELETE /{id}` |
| 8 | `controller/TransactionController.java` | `list` 增加 `keyword`、`categoryId`、`accountId` 可选参数（透传 service） |
| 9 | `service/TransactionService.java` | `list` 签名扩展并透传 mapper |

## 3. 前端改动清单（admin-web/）

| # | 文件 | 改动 |
| --- | --- | --- |
| 1 | `package.json` | 新增依赖 `echarts`（npm install） |
| 2 | `src/api/types.ts` | `AccountInput` 接口；`TransactionQuery`（keyword/categoryId/accountId） |
| 3 | `src/api/index.ts` | `createAccount` / `updateAccount` / `deleteAccount`；`listTransactions` 参数扩展为 `{month, type?, keyword?, categoryId?, accountId?}` |
| 4 | `src/pages/user/Home.tsx`（新建） | 首页仪表盘：今日收支、本月汇总、预算进度（Progress）、最近账单表格、「记一笔」按钮（navigate('/transactions', {state:{openCreate:true}})） |
| 5 | `src/pages/user/Accounts.tsx`（新建） | 账户管理：表格（名称/类型 Tag/余额/操作）、新增/编辑 Modal、删除 Popconfirm |
| 6 | `src/pages/user/Transactions.tsx` | 工具区增加关键词 Input.Search、分类 Select（showSearch）、账户 Select；`useLocation().state.openCreate` 自动打开记一笔弹窗；查询参数接入 api |
| 7 | `src/pages/user/Statistics.tsx` | 引入 echarts（按需 import），新增「每日收支趋势」柱状图与「分类支出占比」环形图两个图表卡片；小分类(<2%)合并「其他」 |
| 8 | `src/App.tsx` | 路由：`index` 改为 `Navigate to /home`；新增 `home`、`accounts` |
| 9 | `src/layouts/BookLayout.tsx` | 菜单：顶部加「首页」(/home, HomeOutlined)、「账户管理」(/accounts, BankOutlined)；账单页选中态兼容 /home 跳转带 state |

## 4. 测试方案

### 4.1 后端冒烟（node 脚本，避免 Windows curl 中文问题）

- 账户：新增（含初始余额）、新增（无初始余额→0）、名称超长 400、编辑、删除空账户、删除被引用账户→1005、删除唯一账户→1006
- 筛选：keyword 命中/未命中、categoryId、accountId、与 month/type 组合
- 回归：记一笔后账户余额联动、删除账单回滚余额（跑既有 smoke-txn.mjs 核心场景）

### 4.2 前端验证

- `npm run build`（tsc + vite）通过
- browser-use 全流程：登录 → 首页数据正确 → 记一笔跳转 → 账户新增/编辑/删除 → 账单筛选 → 统计图表渲染

## 5. 风险与对策

| 风险 | 对策 |
| --- | --- |
| echarts 增大包体 | 仅统计页引入，`echarts/core` + 按需注册 BarChart/PieChart |
| 首页今日数据依赖 daily 数组 | 无数据兜底 0.00 |
| 记一笔弹窗跨页打开 | 用 router state 传 `openCreate`，账单页 mount 时读取一次 |
| 删除账户后历史账单 VO 显示 | 后端已有「已删除账户」兜底文案，无需处理 |
