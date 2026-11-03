import { useEffect, useState } from 'react'
import { Pressable, StyleSheet, Text } from 'react-native'
import { COLORS } from '../lib/format'

interface Props {
  title: string
  danger?: boolean
  onConfirm: () => void
  style?: object
}

// 两段式确认：第一次点击进入待确认态，短时间内再次点击才执行（跨端可用的删除确认）
export default function ConfirmButton({ title, danger, onConfirm, style }: Props) {
  const [arming, setArming] = useState(false)

  useEffect(() => {
    if (!arming) return
    const timer = setTimeout(() => setArming(false), 2500)
    return () => clearTimeout(timer)
  }, [arming])

  return (
    <Pressable
      style={style}
      onPress={() => {
        if (arming) {
          setArming(false)
          onConfirm()
        } else {
          setArming(true)
        }
      }}
    >
      <Text style={[styles.text, danger && styles.danger]}>
        {arming ? `再点一次确认${title}` : title}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    color: COLORS.primary,
  },
  danger: {
    color: COLORS.danger,
  },
})
