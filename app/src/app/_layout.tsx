import { router, Stack, useSegments } from 'expo-router'
import { useEffect, useState } from 'react'
import { initAuth, isLoggedIn, onAuthChange } from '../lib/api'

export default function RootLayout() {
  const [ready, setReady] = useState(false)
  const [authVersion, setAuthVersion] = useState(0)
  const segments = useSegments()

  useEffect(() => {
    initAuth().finally(() => setReady(true))
    return onAuthChange(() => setAuthVersion((v) => v + 1))
  }, [])

  const loggedIn = isLoggedIn()

  useEffect(() => {
    if (!ready) return
    const inAuth = segments[0] === 'login' || segments[0] === 'register'
    if (!loggedIn && !inAuth) {
      router.replace('/login')
    } else if (loggedIn && inAuth) {
      router.replace('/(tabs)')
    }
  }, [ready, loggedIn, authVersion, segments])

  if (!ready) return null

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="login" />
      <Stack.Screen name="register" />
      <Stack.Screen name="(tabs)" />
    </Stack>
  )
}
