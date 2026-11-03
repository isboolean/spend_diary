import client, { adminClient } from './client'
import type {
  Account,
  AccountType,
  AdminCategory,
  AdminDashboard,
  AdminUser,
  AuthResponse,
  Budget,
  Category,
  CategoryType,
  MonthlyStatistics,
  Transaction,
  TransactionType,
  UserInfo,
  UserRole,
} from './types'

export interface TransactionInput {
  accountId: number
  categoryId: number
  type: TransactionType
  amount: number
  occurredAt: string
  note?: string | null
}

export interface CategoryInput {
  name: string
  type: CategoryType
  icon?: string
}

export interface AccountInput {
  name: string
  type: AccountType
  initialBalance?: number
}

export interface TransactionQuery {
  month: string
  type?: TransactionType
  keyword?: string
  categoryId?: number
  accountId?: number
}

export async function login(username: string, password: string): Promise<AuthResponse> {
  const { data } = await client.post('/auth/login', { username, password })
  return data.data as AuthResponse
}

export async function register(
  username: string,
  password: string,
  nickname?: string,
): Promise<AuthResponse> {
  const { data } = await client.post('/auth/register', { username, password, nickname })
  return data.data as AuthResponse
}

export async function me(): Promise<UserInfo> {
  const { data } = await client.get('/auth/me')
  return data.data as UserInfo
}

export async function listAccounts(): Promise<Account[]> {
  const { data } = await client.get('/accounts')
  return data.data as Account[]
}

export async function createAccount(input: AccountInput): Promise<Account> {
  const { data } = await client.post('/accounts', input)
  return data.data as Account
}

export async function updateAccount(id: number, input: AccountInput): Promise<Account> {
  const { data } = await client.put(`/accounts/${id}`, input)
  return data.data as Account
}

export async function deleteAccount(id: number): Promise<void> {
  await client.delete(`/accounts/${id}`)
}

export async function listCategories(): Promise<Category[]> {
  const { data } = await client.get('/categories')
  return data.data as Category[]
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  const { data } = await client.post('/categories', input)
  return data.data as Category
}

export async function updateCategory(id: number, input: CategoryInput): Promise<Category> {
  const { data } = await client.put(`/categories/${id}`, input)
  return data.data as Category
}

export async function deleteCategory(id: number): Promise<void> {
  await client.delete(`/categories/${id}`)
}

export async function listTransactions(query: TransactionQuery): Promise<Transaction[]> {
  const { data } = await client.get('/transactions', { params: query })
  return data.data as Transaction[]
}

export async function createTransaction(input: TransactionInput): Promise<Transaction> {
  const { data } = await client.post('/transactions', input)
  return data.data as Transaction
}

export async function updateTransaction(id: number, input: TransactionInput): Promise<Transaction> {
  const { data } = await client.put(`/transactions/${id}`, input)
  return data.data as Transaction
}

export async function deleteTransaction(id: number): Promise<void> {
  await client.delete(`/transactions/${id}`)
}

export async function getMonthlyStats(month: string): Promise<MonthlyStatistics> {
  const { data } = await client.get('/statistics/monthly', { params: { month } })
  return data.data as MonthlyStatistics
}

export async function getBudget(month: string): Promise<Budget> {
  const { data } = await client.get('/budgets', { params: { month } })
  return data.data as Budget
}

export async function upsertBudget(month: string, amount: number): Promise<Budget> {
  const { data } = await client.put('/budgets', { month, amount })
  return data.data as Budget
}

export async function deleteBudget(month: string): Promise<void> {
  await client.delete('/budgets', { params: { month } })
}

// ---- 后台管理 ----

export async function getAdminDashboard(): Promise<AdminDashboard> {
  const { data } = await adminClient.get('/dashboard')
  return data.data as AdminDashboard
}

export async function listAdminUsers(): Promise<AdminUser[]> {
  const { data } = await adminClient.get('/users')
  return data.data as AdminUser[]
}

export async function updateUserRole(id: number, role: UserRole): Promise<AdminUser> {
  const { data } = await adminClient.put(`/users/${id}/role`, { role })
  return data.data as AdminUser
}

export async function updateUserStatus(id: number, enabled: boolean): Promise<AdminUser> {
  const { data } = await adminClient.put(`/users/${id}/status`, { enabled })
  return data.data as AdminUser
}

export async function listAdminCategories(): Promise<AdminCategory[]> {
  const { data } = await adminClient.get('/categories')
  return data.data as AdminCategory[]
}

export async function createAdminCategory(input: CategoryInput): Promise<AdminCategory> {
  const { data } = await adminClient.post('/categories', input)
  return data.data as AdminCategory
}

export async function updateAdminCategory(id: number, input: CategoryInput): Promise<AdminCategory> {
  const { data } = await adminClient.put(`/categories/${id}`, input)
  return data.data as AdminCategory
}

export async function deleteAdminCategory(id: number): Promise<void> {
  await adminClient.delete(`/categories/${id}`)
}
