import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import { useCallback, useEffect, useState } from 'react'
import { createAccount, deleteAccount, listAccounts, updateAccount, type AccountInput } from '../../api'
import type { Account, AccountType } from '../../api/types'

const TYPE_LABEL: Record<AccountType, string> = {
  CASH: '现金',
  BANK_CARD: '银行卡',
  ALIPAY: '支付宝',
  WECHAT: '微信',
  OTHER: '其他',
}

const TYPE_COLOR: Record<AccountType, string> = {
  CASH: 'green',
  BANK_CARD: 'blue',
  ALIPAY: 'cyan',
  WECHAT: 'gold',
  OTHER: 'default',
}

interface AccountForm {
  name: string
  type: AccountType
  initialBalance?: number
}

export default function Accounts() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Account | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<AccountForm>()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      setAccounts(await listAccounts())
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = () => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'CASH', initialBalance: 0 })
    setModalOpen(true)
  }

  const openEdit = (a: Account) => {
    setEditing(a)
    form.resetFields()
    form.setFieldsValue({ name: a.name, type: a.type })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const input: AccountInput = {
      name: values.name,
      type: values.type,
      initialBalance: values.initialBalance,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateAccount(editing.id, input)
      } else {
        await createAccount(input)
      }
      setModalOpen(false)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await deleteAccount(id)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const columns: ColumnsType<Account> = [
    { title: '名称', dataIndex: 'name', width: 200 },
    {
      title: '类型',
      dataIndex: 'type',
      width: 120,
      render: (t: AccountType) => <Tag color={TYPE_COLOR[t]}>{TYPE_LABEL[t]}</Tag>,
    },
    {
      title: '余额',
      dataIndex: 'balance',
      width: 160,
      align: 'right',
      render: (v: number) => (
        <Typography.Text strong style={{ color: v < 0 ? '#cf1322' : '#1677ff' }}>
          {v.toFixed(2)}
        </Typography.Text>
      ),
    },
    {
      title: '操作',
      width: 110,
      render: (_, r) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确定删除该账户？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="账户管理"
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新增账户
          </Button>
        }
      >
        <Typography.Paragraph type="secondary" style={{ marginBottom: 16 }}>
          余额由账单自动联动维护；账户下存在账单时不可删除，至少保留一个账户。
        </Typography.Paragraph>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={accounts}
          loading={loading}
          pagination={false}
        />
      </Card>

      <Modal
        title={editing ? '编辑账户' : '新增账户'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true, message: '请输入名称' }]}>
            <Input placeholder="账户名称，1-16 字" maxLength={16} />
          </Form.Item>
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Select
              options={(Object.keys(TYPE_LABEL) as AccountType[]).map((t) => ({
                value: t,
                label: TYPE_LABEL[t],
              }))}
            />
          </Form.Item>
          {!editing && (
            <Form.Item name="initialBalance" label="初始余额">
              <InputNumber style={{ width: '100%' }} precision={2} placeholder="0.00" />
            </Form.Item>
          )}
        </Form>
      </Modal>
    </div>
  )
}
