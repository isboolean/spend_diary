import { useFocusEffect, useRouter } from 'expo-router'
import dayjs from 'dayjs'
import { useCallback, useState } from 'react'
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Card from '../../components/Card'
import MonthSwitcher from '../../components/MonthSwitcher'
import { currentNickname, getBudget, getMonthlyStats, listTransactions } from '../../lib/api'
import { COLORS, formatTime, money, signedMoney } from '../../lib/format'
import type { Budget, MonthlyStatistics, Transaction } from '../../lib/types'

export default function Home() {
  const router = useRouter()
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [stats, setStats] = useState<MonthlyStatistics | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      setLoading(true)
      Promise.all([getMonthlyStats(month), getBudget(month), listTransactions({ month })])
        .then(([s, b, t]) => {
          if (cancelled) return
          setStats(s)
          setBudget(b)
          setRecent(t.slice(0, 10))
        })
        .catch(() => undefined)
        .finally(() => {
          if (!cancelled) setLoading(false)
        })
      return () => {
        cancelled = true
      }
    }, [month]),
  )

  const todayStr = dayjs().format('YYYY-MM-DD')
  const today = stats?.daily.find((d) => d.date === todayStr)

  const budgetPercent =
    budget && budget.amount != null && budget.amount > 0
      ? Math.min(Math.round((budget.spent / budget.amount) * 100), 100)
      : 0

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView>
        <View style={styles.header}>
          <View>
            <Text style={styles.appName}>记账本</Text>
            <Text style={styles.hello}>你好，{currentNickname() || '用户'}</Text>
          </View>
          <MonthSwitcher month={month} onChange={setMonth} />
        </View>

        <View style={styles.statGrid}>
          <View style={[styles.statCell, styles.half]}>
            <Text style={styles.statLabel}>今日支出</Text>
            <Text style={[styles.statValue, { color: COLORS.expense }]}>{money(today?.expense ?? 0)}</Text>
          </View>
          <View style={[styles.statCell, styles.half]}>
            <Text style={styles.statLabel}>今日收入</Text>
            <Text style={[styles.statValue, { color: COLORS.income }]}>{money(today?.income ?? 0)}</Text>
          </View>
          <View style={[styles.statCell, styles.half]}>
            <Text style={styles.statLabel}>本月支出</Text>
            <Text style={[styles.statValue, { color: COLORS.expense }]}>
              {money(stats?.totalExpense ?? 0)}
            </Text>
          </View>
          <View style={[styles.statCell, styles.half]}>
            <Text style={styles.statLabel}>本月收入</Text>
            <Text style={[styles.statValue, { color: COLORS.income }]}>
              {money(stats?.totalIncome ?? 0)}
            </Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statLabel}>结余</Text>
            <Text style={[styles.statValue, { color: COLORS.primary }]}>{money(stats?.balance ?? 0)}</Text>
          </View>
        </View>

        <Card title="本月预算">
          {budget && budget.amount != null ? (
            <View>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${budgetPercent}%` },
                    budget.overBudget && styles.progressOver,
                  ]}
                />
              </View>
              <Text style={styles.budgetText}>
                已支出 {money(budget.spent)} / 预算 {money(budget.amount)}
                {budget.overBudget
                  ? `，超支 ${money(Math.abs(budget.remaining ?? 0))}`
                  : `，剩余 ${money(budget.remaining ?? 0)}`}
              </Text>
            </View>
          ) : (
            <Text style={styles.budgetText}>本月未设置预算，可在「我的」中设置</Text>
          )}
        </Card>

        <Card
          title="最近账单"
          right={
            <Pressable onPress={() => router.push('/transactions?new=1')}>
              <Text style={styles.addLink}>＋ 记一笔</Text>
            </Pressable>
          }
        >
          {loading ? (
            <Text style={styles.emptyText}>加载中…</Text>
          ) : recent.length === 0 ? (
            <Text style={styles.emptyText}>本月还没有账单，点击右上角记一笔吧</Text>
          ) : (
            recent.map((tx) => (
              <Pressable
                key={tx.id}
                style={styles.txRow}
                onPress={() => router.push({ pathname: '/transactions', params: { edit: String(tx.id) } })}
              >
                <Text style={styles.txIcon}>{tx.categoryIcon}</Text>
                <View style={styles.txInfo}>
                  <Text style={styles.txName}>{tx.categoryName}</Text>
                  <Text style={styles.txMeta} numberOfLines={1}>
                    {formatTime(tx.occurredAt)}
                    {tx.note ? ` · ${tx.note}` : ''}
                  </Text>
                </View>
                <Text
                  style={[styles.txAmount, { color: tx.type === 'EXPENSE' ? COLORS.expense : COLORS.income }]}
                >
                  {signedMoney(tx.amount, tx.type)}
                </Text>
              </Pressable>
            ))
          )}
        </Card>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
  },
  appName: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
  },
  hello: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    gap: 8,
  },
  statCell: {
    flexBasis: '100%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
  },
  half: {
    flexBasis: '48%',
    flexGrow: 1,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 6,
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  progressOver: {
    backgroundColor: COLORS.danger,
  },
  budgetText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 8,
  },
  addLink: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 8,
  },
  txRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: COLORS.border,
    gap: 10,
  },
  txIcon: {
    fontSize: 22,
  },
  txInfo: {
    flex: 1,
  },
  txName: {
    fontSize: 14,
    color: COLORS.text,
  },
  txMeta: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 15,
    fontWeight: '600',
  },
})
