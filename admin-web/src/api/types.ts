export type TransactionType = 'INCOME' | 'EXPENSE'
export type AccountType = 'CASH' | 'BANK_CARD' | 'ALIPAY' | 'WECHAT' | 'OTHER'
export type CategoryType = 'INCOME' | 'EXPENSE'
export type UserRole = 'USER' | 'ADMIN'

export interface UserInfo {
  id: number
  username: string
  nickname: string
  role: UserRole
}

export interface AuthResponse {
  token: string
  user: UserInfo
}

export interface Account {
  id: number
  ledgerId: number
  name: string
  type: AccountType
  balance: number
}

export interface Category {
  id: number
  name: string
  type: CategoryType
  icon: string
  builtin: boolean
}

export interface Transaction {
  id: number
  accountId: number
  accountName: string
  categoryId: number
  categoryName: string
  categoryIcon: string
  type: TransactionType
  amount: number
  occurredAt: string
  note: string | null
}

export interface CategoryStat {
  categoryId: number
  categoryName: string
  categoryIcon: string
  type: TransactionType
  amount: number
}

export interface DailyStat {
  date: string
  income: number
  expense: number
}

export interface MonthlyStatistics {
  month: string
  totalIncome: number
  totalExpense: number
  balance: number
  byCategory: CategoryStat[]
  daily: DailyStat[]
}

export interface Budget {
  month: string
  amount: number | null
  spent: number
  remaining: number | null
  overBudget: boolean
}

export interface AdminDashboard {
  userCount: number
  transactionMonthCount: number
  transactionTotalCount: number
  monthIncome: number
  monthExpense: number
  dailyTrend: DailyStat[]
}

export interface AdminUser {
  id: number
  username: string
  nickname: string
  role: UserRole
  enabled: boolean
  createdAt: string
  transactionCount: number
}

export interface AdminCategory {
  id: number
  name: string
  type: CategoryType
  icon: string
  builtin: boolean
  ownerUsername: string | null
  usageCount: number
}
