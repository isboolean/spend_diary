import AsyncStorage from '@react-native-async-storage/async-storage'
import axios from 'axios'
import { Alert, Platform } from 'react-native'
import type {
  Account,
  AccountType,
  AuthResponse,
  Budget,
  Category,
  CategoryType,
  MonthlyStatistics,
  Transaction,
  TransactionType,
  UserInfo,
} from './types'

const DEFAULT_HOST = Platform.OS === 'android' ? 'http://10.0.2.2:8080' : 'http://localhost:8080'
export const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_HOST

export interface ApiResponse<T> {
  code: number
  message: string
  data: T
}

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

let token: string | null = null
let nickname: string | null = null
let userRole: string | null = null
let userId: number | null = null
const authListeners = new Set<() => void>()

export function onAuthChange(cb: () => void): () => void {
  authListeners.add(cb)
  return () => {
    authListeners.delete(cb)
  }
}

function notifyAuthChange() {
  authListeners.forEach((cb) => cb())
}

export async function initAuth(): Promise<void> {
  token = await AsyncStorage.getItem('token')
  nickname = await AsyncStorage.getItem('nickname')
  userRole = await AsyncStorage.getItem('userRole')
  const id = await AsyncStorage.getItem('userId')
  userId = id ? Number(id) : null
}

export function isLoggedIn(): boolean {
  return token != null
}

export function currentNickname(): string {
  return nickname ?? ''
}

export function currentRole(): string {
  return userRole ?? 'USER'
}

export function currentUserId(): number | null {
  return userId
}

export async function setAuth(t: string | null, user?: UserInfo): Promise<void> {
  token = t
  nickname = user?.nickname ?? null
  userRole = user?.role ?? null
  userId = user?.id ?? null
  if (t) {
    await AsyncStorage.setItem('token', t)
    if (user) {
      await AsyncStorage.setItem('nickname', user.nickname)
      await AsyncStorage.setItem('userRole', user.role)
      await AsyncStorage.setItem('userId', String(user.id))
    }
  } else {
    await AsyncStorage.multiRemove(['token', 'nickname', 'userRole', 'userId'])
  }
  notifyAuthChange()
}

const client = axios.create({ baseURL: `${BASE_URL}/api/v1/app`, timeout: 10000 })

client.interceptors.request.use((config) => {
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

client.interceptors.response.use(
  (response) => {
    const body = response.data as ApiResponse<unknown>
    if (body.code !== 0) {
      Alert.alert('提示', body.message || '请求失败')
      return Promise.reject(new Error(body.message || '请求失败'))
    }
    return response
  },
  (error) => {
    const status = error.response?.status
    const msg = error.response?.data?.message as string | undefined
    if (status === 401) {
      void setAuth(null)
      Alert.alert('提示', '登录已过期，请重新登录')
    } else {
      Alert.alert('提示', msg || '网络错误，请稍后重试')
    }
    return Promise.reject(error)
  },
)

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
