import type { ReactNode } from 'react'
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native'
import { COLORS } from '../lib/format'

interface Props {
  title?: string
  right?: ReactNode
  children: ReactNode
  style?: StyleProp<ViewStyle>
}

export default function Card({ title, right, children, style }: Props) {
  return (
    <View style={[styles.card, style]}>
      {(title != null || right != null) && (
        <View style={styles.header}>
          {title != null && <Text style={styles.title}>{title}</Text>}
          {right}
        </View>
      )}
      {children}
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: COLORS.text,
  },
})
