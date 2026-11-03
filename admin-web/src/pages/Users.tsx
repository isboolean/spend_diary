import { CheckOutlined, CrownOutlined, StopOutlined } from '@ant-design/icons'
import { Button, Card, Popconfirm, Space, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { listAdminUsers, updateUserRole, updateUserStatus } from '../api'
import type { AdminUser, UserRole } from '../api/types'

export default function Users() {
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(false)
  const currentUserId = Number(localStorage.getItem('userId') ?? '0')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setUsers(await listAdminUsers())
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const handleRole = async (user: AdminUser, role: UserRole) => {
    try {
      await updateUserRole(user.id, role)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const handleStatus = async (user: AdminUser, enabled: boolean) => {
    try {
      await updateUserStatus(user.id, enabled)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const columns: ColumnsType<AdminUser> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', width: 140 },
    {
      title: '昵称',
      dataIndex: 'nickname',
      width: 140,
      render: (v: string) => v || '-',
    },
    {
      title: '角色',
      dataIndex: 'role',
      width: 100,
      render: (r: UserRole) =>
        r === 'ADMIN' ? <Tag color="gold">管理员</Tag> : <Tag>普通用户</Tag>,
    },
    {
      title: '状态',
      dataIndex: 'enabled',
      width: 100,
      render: (v: boolean) => (v ? <Tag color="green">正常</Tag> : <Tag color="red">已禁用</Tag>),
    },
    {
      title: '注册时间',
      dataIndex: 'createdAt',
      width: 170,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm'),
    },
    { title: '账单数', dataIndex: 'transactionCount', width: 90, align: 'right' },
    {
      title: '操作',
      width: 230,
      render: (_, r) =>
        r.id === currentUserId ? (
          <Tag>当前登录账号</Tag>
        ) : (
          <Space>
            {r.role === 'ADMIN' ? (
              <Popconfirm title="将该用户设为普通用户？" onConfirm={() => handleRole(r, 'USER')}>
                <Button size="small" type="text">
                  设为普通用户
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm title="将该用户设为管理员？" onConfirm={() => handleRole(r, 'ADMIN')}>
                <Button size="small" type="text" icon={<CrownOutlined />}>
                  设为管理员
                </Button>
              </Popconfirm>
            )}
            {r.enabled ? (
              <Popconfirm title="禁用后该用户将无法登录，确定禁用？" onConfirm={() => handleStatus(r, false)}>
                <Button size="small" type="text" danger icon={<StopOutlined />}>
                  禁用
                </Button>
              </Popconfirm>
            ) : (
              <Popconfirm title="确定启用该用户？" onConfirm={() => handleStatus(r, true)}>
                <Button size="small" type="text" icon={<CheckOutlined />}>
                  启用
                </Button>
              </Popconfirm>
            )}
          </Space>
        ),
    },
  ]

  return (
    <Card title="用户管理">
      <Table rowKey="id" columns={columns} dataSource={users} loading={loading} pagination={false} />
    </Card>
  )
}
