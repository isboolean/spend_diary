import dayjs from 'dayjs'
import type { AccountType, TransactionType } from './types'

export const COLORS = {
  primary: '#1677ff',
  expense: '#cf1322',
  income: '#3f8600',
  text: '#1f1f1f',
  textSecondary: '#8c8c8c',
  border: '#f0f0f0',
  bg: '#f5f5f5',
  danger: '#ff4d4f',
}

export const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  CASH: '现金',
  BANK_CARD: '银行卡',
  ALIPAY: '支付宝',
  WECHAT: '微信',
  OTHER: '其他',
}

export const ACCOUNT_TYPES: AccountType[] = ['CASH', 'BANK_CARD', 'ALIPAY', 'WECHAT', 'OTHER']

export function money(v: number): string {
  return `¥${v.toFixed(2)}`
}

export function signedMoney(v: number, type: TransactionType): string {
  return `${type === 'EXPENSE' ? '-' : '+'}${v.toFixed(2)}`
}

export function formatTime(s: string): string {
  return dayjs(s).format('MM-DD HH:mm')
}

export function nowString(): string {
  return dayjs().format('YYYY-MM-DD HH:mm')
}

export function toLocalDateTime(input: string): string {
  const d = dayjs(input.trim(), 'YYYY-MM-DD HH:mm')
  return d.isValid() ? d.format('YYYY-MM-DDTHH:mm:ss') : dayjs().format('YYYY-MM-DDTHH:mm:ss')
}

export function monthLabel(month: string): string {
  return dayjs(month).format('YYYY年M月')
}
