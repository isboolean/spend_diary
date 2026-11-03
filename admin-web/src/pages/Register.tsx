import { useState } from 'react'
import { Button, Card, Form, Input, Typography } from 'antd'
import { Link, useNavigate } from 'react-router-dom'
import { register } from '../api'

interface RegisterForm {
  username: string
  password: string
  confirm: string
  nickname?: string
}

export default function Register() {
  const [form] = Form.useForm<RegisterForm>()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)

  const onFinish = async (values: RegisterForm) => {
    setLoading(true)
    try {
      const res = await register(values.username, values.password, values.nickname)
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
        title="注册记账本账号"
        style={{ width: 360 }}
        extra={
          <Typography.Link>
            <Link to="/login">已有账号，去登录</Link>
          </Typography.Link>
        }
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Form.Item
            name="username"
            label="用户名"
            rules={[
              { required: true, message: '请输入用户名' },
              { min: 3, max: 32, message: '长度需在 3-32 之间' },
            ]}
          >
            <Input placeholder="3-32 位用户名" />
          </Form.Item>
          <Form.Item
            name="password"
            label="密码"
            rules={[
              { required: true, message: '请输入密码' },
              { min: 6, max: 64, message: '长度需在 6-64 之间' },
            ]}
          >
            <Input.Password placeholder="6-64 位密码" />
          </Form.Item>
          <Form.Item
            name="confirm"
            label="确认密码"
            dependencies={['password']}
            rules={[
              { required: true, message: '请再次输入密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('password') === value) {
                    return Promise.resolve()
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'))
                },
              }),
            ]}
          >
            <Input.Password placeholder="再次输入密码" />
          </Form.Item>
          <Form.Item name="nickname" label="昵称" rules={[{ max: 32, message: '长度不能超过 32' }]}>
            <Input placeholder="昵称（可选）" />
          </Form.Item>
          <Button type="primary" htmlType="submit" block loading={loading}>
            注册并登录
          </Button>
        </Form>
      </Card>
    </div>
  )
}
