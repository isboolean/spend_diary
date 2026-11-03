import { DeleteOutlined, EditOutlined, PlusOutlined } from '@ant-design/icons'
import {
  Button,
  Card,
  DatePicker,
  Form,
  Input,
  InputNumber,
  Modal,
  Popconfirm,
  Segmented,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useCallback, useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import {
  createTransaction,
  deleteTransaction,
  getMonthlyStats,
  listAccounts,
  listCategories,
  listTransactions,
  updateTransaction,
  type TransactionInput,
} from '../../api'
import type { Account, Category, MonthlyStatistics, Transaction, TransactionType } from '../../api/types'

type TypeFilter = 'ALL' | TransactionType

interface FormValues {
  type: TypeFilter
  amount: number
  accountId: number
  categoryId: number
  occurredAt: Dayjs
  note?: string
}

export default function Transactions() {
  const location = useLocation()
  const navigate = useNavigate()
  const [month, setMonth] = useState<Dayjs>(dayjs())
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('ALL')
  const [keyword, setKeyword] = useState<string>()
  const [categoryFilter, setCategoryFilter] = useState<number>()
  const [accountFilter, setAccountFilter] = useState<number>()
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [accounts, setAccounts] = useState<Account[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [stats, setStats] = useState<MonthlyStatistics | null>(null)
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Transaction | null>(null)
  const [saving, setSaving] = useState(false)
  const [form] = Form.useForm<FormValues>()
  const formType = Form.useWatch('type', form) ?? 'EXPENSE'

  const monthStr = month.format('YYYY-MM')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const [txns, accs, cats, monthly] = await Promise.all([
        listTransactions({
          month: monthStr,
          type: typeFilter === 'ALL' ? undefined : typeFilter,
          keyword: keyword || undefined,
          categoryId: categoryFilter,
          accountId: accountFilter,
        }),
        listAccounts(),
        listCategories(),
        getMonthlyStats(monthStr),
      ])
      setTransactions(txns)
      setAccounts(accs)
      setCategories(cats)
      setStats(monthly)
    } catch {
      // 错误提示由拦截器统一处理
    } finally {
      setLoading(false)
    }
  }, [monthStr, typeFilter, keyword, categoryFilter, accountFilter])

  useEffect(() => {
    void load()
  }, [load])

  const openCreate = useCallback(() => {
    setEditing(null)
    form.resetFields()
    form.setFieldsValue({ type: 'EXPENSE', occurredAt: dayjs() })
    setModalOpen(true)
  }, [form])

  useEffect(() => {
    if ((location.state as { openCreate?: boolean } | null)?.openCreate) {
      navigate(location.pathname, { replace: true })
      openCreate()
    }
  }, [location, navigate, openCreate])

  const openEdit = (t: Transaction) => {
    setEditing(t)
    form.resetFields()
    form.setFieldsValue({
      type: t.type,
      amount: t.amount,
      accountId: t.accountId,
      categoryId: t.categoryId,
      occurredAt: dayjs(t.occurredAt),
      note: t.note ?? undefined,
    })
    setModalOpen(true)
  }

  const handleSave = async () => {
    const values = await form.validateFields()
    const input: TransactionInput = {
      accountId: values.accountId,
      categoryId: values.categoryId,
      type: values.type === 'ALL' ? 'EXPENSE' : values.type,
      amount: values.amount,
      occurredAt: values.occurredAt.format('YYYY-MM-DDTHH:mm:ss'),
      note: values.note || null,
    }
    setSaving(true)
    try {
      if (editing) {
        await updateTransaction(editing.id, input)
      } else {
        await createTransaction(input)
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
      await deleteTransaction(id)
      void load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const categoryOptions = categories
    .filter((c) => c.type === formType)
    .map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))

  const columns: ColumnsType<Transaction> = [
    {
      title: '日期',
      dataIndex: 'occurredAt',
      width: 130,
      render: (v: string) => dayjs(v).format('MM-DD HH:mm'),
    },
    {
      title: '分类',
      render: (_, r) => `${r.categoryIcon} ${r.categoryName}`,
    },
    {
      title: '类型',
      dataIndex: 'type',
      width: 80,
      render: (t: TransactionType) =>
        t === 'EXPENSE' ? <Tag color="red">支出</Tag> : <Tag color="green">收入</Tag>,
    },
    { title: '账户', dataIndex: 'accountName', width: 100 },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      align: 'right',
      render: (v: number, r) => (
        <Typography.Text strong style={{ color: r.type === 'EXPENSE' ? '#cf1322' : '#3f8600' }}>
          {r.type === 'EXPENSE' ? '-' : '+'}
          {v.toFixed(2)}
        </Typography.Text>
      ),
    },
    { title: '备注', dataIndex: 'note', ellipsis: true },
    {
      title: '操作',
      width: 100,
      render: (_, r) => (
        <Space>
          <Button size="small" type="text" icon={<EditOutlined />} onClick={() => openEdit(r)} />
          <Popconfirm title="确定删除这条账单？" onConfirm={() => handleDelete(r.id)}>
            <Button size="small" type="text" danger icon={<DeleteOutlined />} />
          </Popconfirm>
        </Space>
      ),
    },
  ]

  return (
    <div>
      <Card
        title="账单"
        extra={
          <Space>
            <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} allowClear={false} />
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              记一笔
            </Button>
          </Space>
        }
      >
        <Space wrap style={{ marginBottom: 16 }}>
          <Segmented
            options={[
              { label: '全部', value: 'ALL' },
              { label: '支出', value: 'EXPENSE' },
              { label: '收入', value: 'INCOME' },
            ]}
            value={typeFilter}
            onChange={(v) => setTypeFilter(v as TypeFilter)}
          />
          <Input.Search
            placeholder="搜索备注关键词"
            allowClear
            style={{ width: 200 }}
            onSearch={(v) => setKeyword(v.trim() || undefined)}
          />
          <Select
            placeholder="全部分类"
            allowClear
            style={{ width: 160 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categories.map((c) => ({ value: c.id, label: `${c.icon} ${c.name}` }))}
          />
          <Select
            placeholder="全部账户"
            allowClear
            style={{ width: 140 }}
            value={accountFilter}
            onChange={setAccountFilter}
            options={accounts.map((a) => ({ value: a.id, label: a.name }))}
          />
        </Space>
        <Space size="large" style={{ marginBottom: 16 }}>
          <Typography.Text type="secondary">本月支出</Typography.Text>
          <Typography.Text strong style={{ color: '#cf1322', fontSize: 18 }}>
            {stats?.totalExpense.toFixed(2) ?? '-'}
          </Typography.Text>
          <Typography.Text type="secondary">本月收入</Typography.Text>
          <Typography.Text strong style={{ color: '#3f8600', fontSize: 18 }}>
            {stats?.totalIncome.toFixed(2) ?? '-'}
          </Typography.Text>
          <Typography.Text type="secondary">结余</Typography.Text>
          <Typography.Text strong style={{ fontSize: 18 }}>
            {stats?.balance.toFixed(2) ?? '-'}
          </Typography.Text>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={transactions}
          loading={loading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
        />
      </Card>

      <Modal
        title={editing ? '编辑账单' : '记一笔'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
        confirmLoading={saving}
        destroyOnHidden
      >
        <Form form={form} layout="vertical">
          <Form.Item name="type" label="类型" rules={[{ required: true }]}>
            <Segmented
              options={[
                { label: '支出', value: 'EXPENSE' },
                { label: '收入', value: 'INCOME' },
              ]}
            />
          </Form.Item>
          <Form.Item name="amount" label="金额" rules={[{ required: true, message: '请输入金额' }]}>
            <InputNumber style={{ width: '100%' }} min={0.01} precision={2} placeholder="0.00" />
          </Form.Item>
          <Form.Item name="categoryId" label="分类" rules={[{ required: true, message: '请选择分类' }]}>
            <Select placeholder="选择分类" options={categoryOptions} />
          </Form.Item>
          <Form.Item name="accountId" label="账户" rules={[{ required: true, message: '请选择账户' }]}>
            <Select placeholder="选择账户" options={accounts.map((a) => ({ value: a.id, label: a.name }))} />
          </Form.Item>
          <Form.Item name="occurredAt" label="时间" rules={[{ required: true, message: '请选择时间' }]}>
            <DatePicker style={{ width: '100%' }} showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
          <Form.Item name="note" label="备注">
            <Input placeholder="备注（可选）" maxLength={200} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  )
}
