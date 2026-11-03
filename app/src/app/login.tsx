import { Link, router } from 'expo-router'
import { useState } from 'react'
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { login, setAuth } from '../lib/api'
import { COLORS } from '../lib/format'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const submit = async () => {
    if (!username.trim() || !password) {
      Alert.alert('提示', '请输入用户名和密码')
      return
    }
    setLoading(true)
    try {
      const res = await login(username.trim(), password)
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
      <Text style={styles.title}>记账本</Text>
      <Text style={styles.subtitle}>登录后开始记账</Text>
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="用户名"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <TextInput
          style={styles.input}
          placeholder="密码"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <Pressable style={[styles.primaryBtn, loading && styles.disabled]} onPress={submit} disabled={loading}>
          <Text style={styles.primaryBtnText}>{loading ? '登录中…' : '登录'}</Text>
        </Pressable>
      </View>
      <Link href="/register" style={styles.link}>
        没有账号？注册一个
      </Link>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    textAlign: 'center',
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
  link: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 20,
    fontSize: 14,
  },
})
