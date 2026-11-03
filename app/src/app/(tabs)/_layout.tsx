import { Tabs } from 'expo-router'
import { Text, type ColorValue } from 'react-native'
import { COLORS } from '../../lib/format'

const tabIcon = (emoji: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ fontSize: 20, color }}>{emoji}</Text>
  }

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: COLORS.primary }}>
      <Tabs.Screen name="index" options={{ title: '首页', tabBarIcon: tabIcon('🏠') }} />
      <Tabs.Screen name="transactions" options={{ title: '账单', tabBarIcon: tabIcon('📒') }} />
      <Tabs.Screen name="statistics" options={{ title: '统计', tabBarIcon: tabIcon('📊') }} />
      <Tabs.Screen name="profile" options={{ title: '我的', tabBarIcon: tabIcon('👤') }} />
    </Tabs>
  )
}
