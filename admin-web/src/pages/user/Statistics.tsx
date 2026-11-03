import { Card, Col, DatePicker, Progress, Row, Statistic, Table, Tag } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import dayjs, { type Dayjs } from 'dayjs'
import * as echarts from 'echarts/core'
import { useEffect, useMemo, useState } from 'react'
import { getMonthlyStats } from '../../api'
import type { CategoryStat, DailyStat, MonthlyStatistics, TransactionType } from '../../api/types'
import useChart from '../../hooks/useChart'

export default function Statistics() {
  const [month, setMonth] = useState<Dayjs>(dayjs())
  const [stats, setStats] = useState<MonthlyStatistics | null>(null)
  const [loading, setLoading] = useState(false)

  const monthStr = month.format('YYYY-MM')

  useEffect(() => {
    setLoading(true)
    getMonthlyStats(monthStr)
      .then(setStats)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [monthStr])

  const trendOption = useMemo<echarts.EChartsCoreOption | null>(() => {
    const daily = stats?.daily ?? []
    if (daily.length === 0) return null

    // 补齐整月日期，无账单的日期按 0 展示，保证趋势轴完整
    const byDate = new Map(daily.map((d) => [d.date.slice(8), d]))
    const dates: string[] = []
    const expenses: number[] = []
    const incomes: number[] = []
    for (let day = 1; day <= month.daysInMonth(); day++) {
      const key = String(day).padStart(2, '0')
      dates.push(key)
      const stat = byDate.get(key)
      expenses.push(stat ? stat.expense : 0)
      incomes.push(stat ? stat.income : 0)
    }

    // 顶部留余量，避免柱子顶到绘图区上沿
    const dataMax = Math.max(...expenses, ...incomes, 0)
    const yMax = Math.max(5, Math.ceil((dataMax * 1.2) / 5) * 5)

    const barLabel = {
      show: true,
      position: 'top' as const,
      fontSize: 11,
      formatter: (p: unknown) => {
        const v = Number((p as { value: unknown }).value)
        return v > 0 ? String(v) : ''
      },
    }

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        valueFormatter: (v: unknown) => `¥${Number(v).toFixed(2)}`,
      },
      legend: { data: ['支出', '收入'], top: 0, right: 0, itemWidth: 12, itemHeight: 8 },
      grid: { left: 48, right: 16, top: 36, bottom: 24 },
      xAxis: {
        type: 'category',
        data: dates,
        axisTick: { alignWithLabel: true },
      },
      yAxis: {
        type: 'value',
        min: 0,
        max: yMax,
        splitLine: { lineStyle: { type: 'dashed', color: '#f0f0f0' } },
      },
      series: [
        {
          name: '支出',
          type: 'bar',
          data: expenses,
          itemStyle: { color: '#cf1322', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 24,
          label: { ...barLabel, color: '#cf1322' },
        },
        {
          name: '收入',
          type: 'bar',
          data: incomes,
          itemStyle: { color: '#3f8600', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 24,
          label: { ...barLabel, color: '#3f8600' },
        },
      ],
    }
  }, [stats, month])

  const pieOption = useMemo<echarts.EChartsCoreOption | null>(() => {
    const expenses = (stats?.byCategory ?? []).filter((c) => c.type === 'EXPENSE')
    if (expenses.length === 0) return null
    const total = expenses.reduce((s, c) => s + c.amount, 0)
    const data = expenses
      .filter((c) => c.amount / total >= 0.02)
      .map((c) => ({ name: c.categoryName, value: c.amount }))
    const others = total - data.reduce((s, d) => s + d.value, 0)
    if (others > 0) {
      data.push({ name: '其他', value: Math.round(others * 100) / 100 })
    }
    return {
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { bottom: 0 },
      series: [
        {
          name: '分类支出',
          type: 'pie',
          radius: ['40%', '68%'],
          center: ['50%', '45%'],
          data,
          label: { formatter: '{b}\n{d}%' },
        },
      ],
    }
  }, [stats])

  const trendRef = useChart(trendOption)
  const pieRef = useChart(pieOption)

  const categoryColumns: ColumnsType<CategoryStat> = [
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
      render: (v: number) => v.toFixed(2),
    },
    {
      title: '占比',
      width: 220,
      render: (_, r) => {
        const total = r.type === 'EXPENSE' ? stats?.totalExpense : stats?.totalIncome
        const percent = total ? Math.round((r.amount / total) * 100) : 0
        return <Progress percent={percent} size="small" />
      },
    },
  ]

  const dailyColumns: ColumnsType<DailyStat> = [
    { title: '日期', dataIndex: 'date', width: 140 },
    {
      title: '收入',
      dataIndex: 'income',
      width: 140,
      align: 'right',
      render: (v: number) => (v > 0 ? <span style={{ color: '#3f8600' }}>+{v.toFixed(2)}</span> : '-'),
    },
    {
      title: '支出',
      dataIndex: 'expense',
      width: 140,
      align: 'right',
      render: (v: number) => (v > 0 ? <span style={{ color: '#cf1322' }}>-{v.toFixed(2)}</span> : '-'),
    },
  ]

  return (
    <div>
      <Card
        title="月度统计"
        extra={
          <DatePicker picker="month" value={month} onChange={(v) => v && setMonth(v)} allowClear={false} />
        }
      >
        <Row gutter={16} style={{ marginBottom: 24 }}>
          <Col span={8}>
            <Card>
              <Statistic title="总收入" value={stats?.totalIncome ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#3f8600' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="总支出" value={stats?.totalExpense ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#cf1322' }} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="结余" value={stats?.balance ?? 0} precision={2} prefix="¥" valueStyle={{ color: '#1677ff' }} />
            </Card>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={14}>
            <Card title="每日收支趋势" size="small">
              <div style={{ position: 'relative', height: 280 }}>
                {!trendOption && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
                    本月暂无账单
                  </div>
                )}
                <div ref={trendRef} style={{ height: 280 }} />
              </div>
            </Card>
          </Col>
          <Col span={10}>
            <Card title="分类支出占比" size="small">
              <div style={{ position: 'relative', height: 280 }}>
                {!pieOption && (
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#999',
                    }}
                  >
                    本月暂无支出
                  </div>
                )}
                <div ref={pieRef} style={{ height: 280 }} />
              </div>
            </Card>
          </Col>
        </Row>

        <Card title="分类统计" size="small" style={{ marginBottom: 16 }}>
          <Table
            rowKey="categoryId"
            columns={categoryColumns}
            dataSource={stats?.byCategory ?? []}
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
        <Card title="每日收支" size="small">
          <Table
            rowKey="date"
            columns={dailyColumns}
            dataSource={stats?.daily ?? []}
            loading={loading}
            pagination={false}
            size="small"
          />
        </Card>
      </Card>
    </div>
  )
}
