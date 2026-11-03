import { useFocusEffect } from 'expo-router'
import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import BarChart from '../../components/BarChart'
import Card from '../../components/Card'
import MonthSwitcher from '../../components/MonthSwitcher'
import { getMonthlyStats } from '../../lib/api'
import { COLORS, money } from '../../lib/format'
import type { DailyStat, MonthlyStatistics } from '../../lib/types'

export default function Statistics() {
  const [month, setMonth] = useState(dayjs().format('YYYY-MM'))
  const [stats, setStats] = useState<MonthlyStatistics | null>(null)

  useFocusEffect(
    useCallback(() => {
      let cancelled = false
      getMonthlyStats(month)
        .then((s) => {
          if (!cancelled) setStats(s)
        })
        .catch(() => undefined)
      return () => {
        cancelled = true
      }
    }, [month]),
  )

  const categoryRows = useMemo(() => {
    const rows = (stats?.byCategory ?? []).filter((c) => c.type === 'EXPENSE')
    const total = rows.reduce((s, c) => s + c.amount, 0)
    return rows
      .sort((a, b) => b.amount - a.amount)
      .map((c) => ({ ...c, percent: total > 0 ? Math.round((c.amount / total) * 100) : 0 }))
  }, [stats])

  const days: DailyStat[] = useMemo(() => {
    const byDate = new Map((stats?.daily ?? []).map((d) => [d.date, d]))
    const result: DailyStat[] = []
    for (let day = 1; day <= dayjs(month).daysInMonth(); day++) {
      const date = `${month}-${String(day).padStart(2, '0')}`
      const stat = byDate.get(date)
      result.push(stat ?? { date, income: 0, expense: 0 })
    }
    return result
  }, [stats, month])

  return (
    <SafeAreaView style={styles.wrap} edges={['top']}>
      <ScrollView>
        <View style={styles.topBar}>
          <Text style={styles.topTitle}>统计</Text>
          <MonthSwitcher month={month} onChange={setMonth} />
        </View>

        <View style={styles.summary}>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>收入</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>
              {money(stats?.totalIncome ?? 0)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>支出</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>
              {money(stats?.totalExpense ?? 0)}
            </Text>
          </View>
          <View style={styles.summaryCell}>
            <Text style={styles.summaryLabel}>结余</Text>
            <Text style={[styles.summaryValue, { color: COLORS.primary }]}>
              {money(stats?.balance ?? 0)}
            </Text>
          </View>
        </View>

        <View style={styles.body}>
          <Card title="每日收支趋势">
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.expense }]} />
                <Text style={styles.legendText}>支出</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: COLORS.income }]} />
                <Text style={styles.legendText}>收入</Text>
              </View>
            </View>
            <BarChart days={days} height={170} />
          </Card>

          <Card title="分类支出排行">
            {categoryRows.length === 0 ? (
              <Text style={styles.emptyText}>本月暂无支出</Text>
            ) : (
              categoryRows.map((c) => (
                <View key={c.categoryId} style={styles.catRow}>
                  <Text style={styles.catName} numberOfLines={1}>
                    {c.categoryIcon} {c.categoryName}
                  </Text>
                  <View style={styles.catTrack}>
                    <View style={[styles.catFill, { width: `${c.percent}%` }]} />
                  </View>
                  <Text style={styles.catAmount}>{money(c.amount)}</Text>
                  <Text style={styles.catPercent}>{c.percent}%</Text>
                </View>
              ))
            )}
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff',
  },
  topTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.text,
    width: 56,
  },
  summary: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  summaryCell: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 12,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 4,
  },
  body: {
    paddingHorizontal: 12,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 14,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 2,
  },
  legendText: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  emptyText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 7,
  },
  catName: {
    width: 96,
    fontSize: 13,
    color: COLORS.text,
  },
  catTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.bg,
    overflow: 'hidden',
  },
  catFill: {
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  catAmount: {
    width: 76,
    fontSize: 13,
    color: COLORS.text,
    textAlign: 'right',
  },
  catPercent: {
    width: 34,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'right',
  },
})
