import { StyleSheet, Text, View } from 'react-native'
import { COLORS } from '../lib/format'
import type { DailyStat } from '../lib/types'

interface Props {
  days: DailyStat[]
  height?: number
}

export default function BarChart({ days, height = 160 }: Props) {
  const hasData = days.some((d) => d.income > 0 || d.expense > 0)
  if (!hasData) {
    return (
      <View style={[styles.empty, { height }]}>
        <Text style={styles.emptyText}>本月暂无账单</Text>
      </View>
    )
  }

  const max = Math.max(...days.map((d) => Math.max(d.income, d.expense)), 1)
  const plotHeight = height - 20

  return (
    <View style={[styles.row, { height }]}>
      {days.map((d) => {
        const dayNum = Number(d.date.slice(8))
        const showLabel = dayNum === 1 || dayNum % 7 === 0 || dayNum === days.length
        const incomeHeight = d.income > 0 ? Math.max((d.income / max) * plotHeight, 2) : 0
        const expenseHeight = d.expense > 0 ? Math.max((d.expense / max) * plotHeight, 2) : 0
        return (
          <View key={d.date} style={styles.dayCol}>
            <View style={[styles.bars, { height: plotHeight }]}>
              {incomeHeight > 0 && (
                <View style={[styles.bar, styles.incomeBar, { height: incomeHeight }]} />
              )}
              {expenseHeight > 0 && (
                <View style={[styles.bar, styles.expenseBar, { height: expenseHeight }]} />
              )}
            </View>
            <Text style={styles.dayLabel}>{showLabel ? dayNum : ''}</Text>
          </View>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 2,
  },
  dayCol: {
    flex: 1,
    alignItems: 'center',
  },
  bars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: 1,
  },
  bar: {
    width: 3,
    borderTopLeftRadius: 1,
    borderTopRightRadius: 1,
  },
  incomeBar: {
    backgroundColor: COLORS.income,
  },
  expenseBar: {
    backgroundColor: COLORS.expense,
  },
  dayLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: COLORS.textSecondary,
  },
})
