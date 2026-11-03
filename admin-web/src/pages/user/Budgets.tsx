import { Button, Card, Col, DatePicker, InputNumber, Progress, Row, Space, Statistic } from 'antd'
import dayjs, { type Dayjs } from 'dayjs'
import { useEffect, useState } from 'react'
import { deleteBudget, getBudget, upsertBudget } from '../../api'
import type { Budget } from '../../api/types'

export default function Budgets() {
  const [month, setMonth] = useState<Dayjs>(dayjs())
  const [budget, setBudget] = useState<Budget | null>(null)
  const [amount, setAmount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  const monthStr = month.format('YYYY-MM')

  const load = () => {
    setLoading(true)
    getBudget(monthStr)
      .then((b) => {
        setBudget(b)
        setAmount(b.amount)
      })
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthStr])

  const handleSave = async () => {
    if (!amount) return
    try {
      const res = await upsertBudget(monthStr, amount)
      setBudget(res)
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const handleClear = async () => {
    try {
      await deleteBudget(monthStr)
      load()
    } catch {
      // 错误提示由拦截器统一处理
    }
  }

  const percent =
    budget?.amount && budget.amount > 0 ? Math.min(100, Math.round((budget.spent / budget.amount) * 100)) : 0

  return (
    <div>
      <Card
        title="月度预算"
        extra={
          <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} allowClear={false} />
        }
        loading={loading}
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={6}>
            <Statistic title="预算" value={budget?.amount ?? 0} precision={2} prefix="¥" />
          </Col>
          <Col span={6}>
            <Statistic title="已支出" value={budget?.spent ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
          </Col>
          <Col span={6}>
            <Statistic
              title="剩余"
              value={budget?.remaining ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: budget?.overBudget ? '#cf1322' : '#3f8600' }}
            />
          </Col>
          <Col span={6}>
            <Statistic title="状态" value={budget?.overBudget ? '已超支' : budget?.amount ? '正常' : '未设置'} />
          </Col>
        </Row>
        <Progress
          percent={percent}
          status={budget?.overBudget ? 'exception' : 'active'}
          style={{ marginBottom: 24 }}
        />
        <Space>
          <InputNumber
            style={{ width: 200 }}
            min={0.01}
            precision={2}
            placeholder="设置本月预算金额"
            value={amount}
            onChange={setAmount}
          />
          <Button type="primary" onClick={handleSave} disabled={!amount}>
            保存预算
          </Button>
          <Button onClick={handleClear} disabled={!budget?.amount}>
            清除预算
          </Button>
        </Space>
      </Card>
    </div>
  )
}
