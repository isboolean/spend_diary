import { router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { register, setAuth } from '../lib/api'
import { COLORS } from '../lib/format'

export default function Register() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [nickname, setNickname] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    const name = username.trim()
    if (name.length < 3 || name.length > 32) {
      Alert.alert('提示', '用户名长度需在 3-32 之间')
      return
    }
    if (password.length < 6 || password.length > 64) {
      Alert.alert('提示', '密码长度需在 6-64 之间')
      return
    }
    if (password !== confirm) {
      Alert.alert('提示', '两次输入的密码不一致')
      return
    }
    setLoading(true)
    try {
      const res = await register(name, password, nickname.trim() || undefined)
      await setAuth(res.token, res.user)
      router.replace('/(tabs)')
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.wrap}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>注册账号</Text>
        <Text style={styles.subtitle}>注册后自动登录</Text>
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="用户名（3-32 位）"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            autoCorrect={false}
          />
          <TextInput
            style={styles.input}
            placeholder="密码（6-64 位）"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="确认密码"
            value={confirm}
            onChangeText={setConfirm}
            secureTextEntry
          />
          <TextInput
            style={styles.input}
            placeholder="昵称（可选）"
            value={nickname}
            onChangeText={setNickname}
          />
          <Pressable style={[styles.primaryBtn, loading && styles.disabled]} onPress={submit} disabled={loading}>
            <Text style={styles.primaryBtnText}>{loading ? '注册中…' : '注册并登录'}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
    marginTop: 48,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 32,
  },
  form: {
    gap: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d9d9d9',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 44,
    fontSize: 15,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  disabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
})
