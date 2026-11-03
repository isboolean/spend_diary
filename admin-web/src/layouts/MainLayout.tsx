import type { MenuProps } from 'antd'
import { Layout, Menu } from 'antd'
import { DashboardOutlined, HomeOutlined, TagsOutlined, TeamOutlined } from '@ant-design/icons'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'

const items: MenuProps['items'] = [
  { key: '/transactions', icon: <HomeOutlined />, label: '返回记账本' },
  { key: '/admin/dashboard', icon: <DashboardOutlined />, label: '数据看板' },
  { key: '/admin/users', icon: <TeamOutlined />, label: '用户管理' },
  { key: '/admin/categories', icon: <TagsOutlined />, label: '分类管理' },
]

export default function MainLayout() {
  const navigate = useNavigate()
  const location = useLocation()

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
          记账后台
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={[location.pathname]}
          items={items}
          onClick={({ key }) => navigate(key)}
        />
      </Layout.Sider>
      <Layout>
        <Layout.Content style={{ margin: 16 }}>
          <Outlet />
        </Layout.Content>
      </Layout>
    </Layout>
  )
}
