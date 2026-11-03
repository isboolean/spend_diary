import { Card, Col, Row, Statistic } from 'antd'
import * as echarts from 'echarts/core'
import { useEffect, useMemo, useState } from 'react'
import { getAdminDashboard } from '../api'
import type { AdminDashboard } from '../api/types'
import useChart from '../hooks/useChart'

export default function Dashboard() {
  const [data, setData] = useState<AdminDashboard | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setLoading(true)
    getAdminDashboard()
      .then(setData)
      .catch(() => undefined)
      .finally(() => setLoading(false))
  }, [])

  const trendOption = useMemo<echarts.EChartsCoreOption | null>(() => {
    const daily = data?.dailyTrend ?? []
    if (daily.length === 0) return null

    const dates = daily.map((d) => d.date.slice(5))
    const expenses = daily.map((d) => d.expense)
    const incomes = daily.map((d) => d.income)

    // 顶部留余量，避免柱子顶到绘图区上沿
    const dataMax = Math.max(...expenses, ...incomes, 0)
    const yMax = Math.max(5, Math.ceil((dataMax * 1.2) / 5) * 5)

    const barLabel = {
      show: true,
      position: 'top' as const,
      fontSize: 10,
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
      xAxis: { type: 'category', data: dates, axisTick: { alignWithLabel: true } },
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
          barMaxWidth: 16,
          label: { ...barLabel, color: '#cf1322' },
        },
        {
          name: '收入',
          type: 'bar',
          data: incomes,
          itemStyle: { color: '#3f8600', borderRadius: [3, 3, 0, 0] },
          barMaxWidth: 16,
          label: { ...barLabel, color: '#3f8600' },
        },
      ],
    }
  }, [data])

  const trendRef = useChart(trendOption)

  return (
    <div>
      <Card title="数据看板" loading={loading}>
        <Row gutter={16}>
          <Col span={8}>
            <Card>
              <Statistic title="用户数" value={data?.userCount ?? 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="本月账单数" value={data?.transactionMonthCount ?? 0} />
            </Card>
          </Col>
          <Col span={8}>
            <Card>
              <Statistic title="账单总数" value={data?.transactionTotalCount ?? 0} />
            </Card>
          </Col>
        </Row>
        <Row gutter={16} style={{ marginTop: 16 }}>
          <Col span={12}>
            <Card>
              <Statistic
                title="本月收入"
                value={data?.monthIncome ?? 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#3f8600' }}
              />
            </Card>
          </Col>
          <Col span={12}>
            <Card>
              <Statistic
                title="本月支出"
                value={data?.monthExpense ?? 0}
                precision={2}
                prefix="¥"
                valueStyle={{ color: '#cf1322' }}
              />
            </Card>
          </Col>
        </Row>
        <Card title="近 14 日收支趋势" size="small" style={{ marginTop: 16 }}>
          <div style={{ position: 'relative', height: 300 }}>
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
                暂无数据
              </div>
            )}
            <div ref={trendRef} style={{ height: 300 }} />
          </div>
        </Card>
      </Card>
    </div>
  )
}
