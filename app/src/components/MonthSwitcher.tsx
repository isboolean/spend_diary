import dayjs from 'dayjs'
import { Pressable, StyleSheet, Text, View } from 'react-native'
import { COLORS, monthLabel } from '../lib/format'

interface Props {
  month: string
  onChange: (month: string) => void
}

export default function MonthSwitcher({ month, onChange }: Props) {
  const prev = () => onChange(dayjs(month).subtract(1, 'month').format('YYYY-MM'))
  const next = () => onChange(dayjs(month).add(1, 'month').format('YYYY-MM'))

  return (
    <View style={styles.row}>
      <Pressable style={styles.btn} onPress={prev} hitSlop={8}>
        <Text style={styles.btnText}>‹</Text>
      </Pressable>
      <Text style={styles.label}>{monthLabel(month)}</Text>
      <Pressable style={styles.btn} onPress={next} hitSlop={8}>
        <Text style={styles.btnText}>›</Text>
      </Pressable>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  btn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 18,
    color: COLORS.text,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    minWidth: 96,
    textAlign: 'center',
  },
})
