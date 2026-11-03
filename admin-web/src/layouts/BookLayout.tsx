import {
  AccountBookOutlined,
  BankOutlined,
  BarChartOutlined,
  HomeOutlined,
  LogoutOutlined,
  SettingOutlined,
  TagsOutlined,
  WalletOutlined,
} from '@ant-design/icons'
import type { MenuProps } from 'antd'
import { Button, Layout, Menu, Typography } from 'antd'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

type MenuItem = NonNullable<MenuProps['items']>[number]

const items: MenuItem[] = [
  { key: '/home', icon: <HomeOutlined />, label: '首页' },
  { key: '/transactions', icon: <AccountBookOutlined />, label: '账单' },
  { key: '/statistics', icon: <BarChartOutlined />, label: '统计' },
  { key: '/budgets', icon: <WalletOutlined />, label: '预算' },
  { key: '/categories', icon: <TagsOutlined />, label: '分类管理' },
  { key: '/accounts', icon: <BankOutlined />, label: '账户管理' },
]

const adminItem: MenuItem = {
  key: '/admin',
  icon: <SettingOutlined />,
  label: '后台管理',
}

export default function BookLayout() {
  const navigate = useNavigate()
  const location = useLocation()
  const nickname = localStorage.getItem('nickname') || ''
  const isAdmin = localStorage.getItem('userRole') === 'ADMIN'

  const logout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('nickname')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userId')
    navigate('/login')
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Layout.Sider>
        <div
          style={{
            height: 48,
            margin: 16,
            color: '#fff',
            fontSize: 16,
            fontWeight: 600,
            textAlign: 'center',
            lineHeight: '48px',
          }}
        >
          记账本
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={isAdmin ? [...items, adminItem] : items}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Header
          style={{
            background: '#fff',
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 16,
            paddingInline: 24,
          }}
        >
          <Typography.Text strong>{nickname}</Typography.Text>
          <Button icon={<LogoutOutlined />} onClick={logout}>
            退出登录
          </Button>
        </Layout.Header>
        <Layout.Content style={{ margin: 16 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
