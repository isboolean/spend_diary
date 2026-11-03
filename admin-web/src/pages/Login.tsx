import { useState } from 'react'
import { Button, Card, Form, Input, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { login } from '../api'

export default function Login() {
  const [form] = Form.useForm()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: { username: string; password: string }) => {
    setLoading(true)
    try {
      const res = await login(values.username, values.password)
      localStorage.setItem('token', res.token)
      localStorage.setItem('nickname', res.user.nickname)
      localStorage.setItem('userRole', res.user.role)
      localStorage.setItem('userId', String(res.user.id))
      navigate('/')
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#f5f5f5',
      }}
    >
      <Card
        title="记账本"
        style={{ width: 360 }}
        extra={
          <Typography.Link>
            <Link to="/register">注册账号</Link>
          </Typography.Link>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item name="username" label="用户名" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" label="密码" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password placeholder="密码" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
