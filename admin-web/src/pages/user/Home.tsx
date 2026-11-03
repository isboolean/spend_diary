import { PlusOutlined } from '@ant-design/icons'
import { Button, Card, Col, Progress, Row, Statistic, Table, Tag, Typography } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { getBudget, getMonthlyStats, listTransactions } from '../../api'
import type { Budget, MonthlyStatistics, Transaction, TransactionType } from '../../api/types'

export default function Home() {
  const navigate = useNavigate()
  const month: Dayjs = useMemo(() => dayjs(), [])
  const monthStr = month.format('YYYY-MM')
  const todayStr = dayjs().format('YYYY-MM-DD')

  const [stats, setStats] = useState<MonthlyStatistics | null>(null)
  const [budget, setBudget] = useState<Budget | null>(null)
  const [recent, setRecent] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    Promise.all([getMonthlyStats(monthStr), getBudget(monthStr), listTransactions({ month: monthStr })])
      .then(([s, b, t]) => {
        setStats(s)
        setBudget(b)
        setRecent(t.slice(0, 10))
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [monthStr])

  const today = stats?.daily.find((d) => d.date === todayStr)

  const budgetPercent = useMemo(() => {
    if (!budget || budget.amount == null || budget.amount <= 0) return 0
    return Math.min(Math.round((budget.spent / budget.amount) * 100), 100)
  }, [budget])

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
  ]

  return (
    <div>
      <Row gutter={16}>
        <Col span={6}>
          <Card>
            <Statistic title="今日支出" value={today?.expense ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="今日收入" value={today?.income ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月支出" value={stats?.totalExpense ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic title="本月收入" value={stats?.totalIncome ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#3f8600' }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16} style={{ marginTop: 16 }}>
        <Col span={6}>
          <Card>
            <Statistic title="结余" value={stats?.balance ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#1677ff' }} />
          </Card>
        </Col>
        <Col span={18}>
          <Card title="本月预算" loading={loading}>
            {budget && budget.amount != null ? (
              <>
                <Progress
                  percent={budgetPercent}
                  status={budget.overBudget ? 'exception' : 'normal'}
                />
                <Typography.Text type="secondary">
                  已支出 ¥{budget.spent.toFixed(2)} / 预算 ¥{budget.amount.toFixed(2)}
                  {budget.overBudget
                    ? `，超支 ¥${Math.abs(budget.remaining ?? 0).toFixed(2)}`
                    : `，剩余 ¥${(budget.remaining ?? 0).toFixed(2)}`}
                </Typography.Text>
              </>
            ) : (
              <Typography.Text type="secondary">本月未设置预算</Typography.Text>
            )}
          </Card>
        </Col>
      </Row>

      <Card
        title="最近账单"
        style={{ marginTop: 16 }}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/transactions', { state: { openCreate: true } })}>
            记一笔
          </Button>
        }
      >
        <Table
          rowKey="id"
          columns={columns}
          dataSource={recent}
          loading={loading}
          pagination={false}
          locale={{ emptyText: '本月还没有账单，点击右上角记一笔吧' }}
        />
      </Card>
    </div>
  )
}
