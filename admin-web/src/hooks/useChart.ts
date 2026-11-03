import * as echarts from 'echarts/core'
import { BarChart, PieChart } from 'echarts/charts'
import { GridComponent, LegendComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import { useCallback, useEffect, useRef, useState } from 'react'

echarts.use([BarChart, PieChart, GridComponent, LegendComponent, TooltipComponent, CanvasRenderer])

// echarts 6 init() 会清空容器子节点，因此图表 div 内不能有任何 React 管理的子元素
export default function useChart(option: echarts.EChartsCoreOption | null) {
  const [node, setNode] = useState<HTMLDivElement | null>(null)
  const chartRef = useRef<echarts.ECharts>()

  // 回调 ref：容器可能晚于首次渲染挂载（如 Card loading 骨架期间），挂载后再补初始化
  const containerRef = useCallback((n: HTMLDivElement | null) => {
    setNode(n)
  }, [])

  useEffect(() => {
    if (!node) {
      chartRef.current?.dispose()
      chartRef.current = undefined
      return
    }
    let chart = chartRef.current
    if (!chart) {
      chart = echarts.init(node)
      chartRef.current = chart
    }
    if (option) {
      chart.setOption(option, true)
    } else {
      chart.clear()
    }
  }, [node, option])

  useEffect(() => {
    const onResize = () => chartRef.current?.resize()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      chartRef.current?.dispose()
      chartRef.current = undefined
    }
  }, [])

  return containerRef
}
