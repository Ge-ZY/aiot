import { onMounted, onUnmounted } from 'vue'
import type { ECharts } from 'echarts'

type ChartGetter = () => (ECharts | null | undefined)[]
type ContainerGetter = () => (HTMLElement | null | undefined)[]

export function useChartResize(getCharts: ChartGetter, getContainers: ContainerGetter = () => []) {
  let resizeObserver: ResizeObserver | null = null
  let rafId = 0

  const resizeCharts = () => {
    cancelAnimationFrame(rafId)
    rafId = requestAnimationFrame(() => {
      getCharts().forEach((chart) => {
        if (chart && !chart.isDisposed()) {
          chart.resize()
        }
      })
    })
  }

  const observeContainers = () => {
    if (typeof ResizeObserver === 'undefined') return
    const containers = getContainers().filter(Boolean) as HTMLElement[]
    if (!containers.length) return

    if (!resizeObserver) {
      resizeObserver = new ResizeObserver(resizeCharts)
    } else {
      resizeObserver.disconnect()
    }
    containers.forEach((el) => resizeObserver!.observe(el))
  }

  const handleFullscreenChange = () => resizeCharts()

  onMounted(() => {
    window.addEventListener('resize', resizeCharts)
    document.addEventListener('fullscreenchange', handleFullscreenChange)
    window.visualViewport?.addEventListener('resize', resizeCharts)
    observeContainers()
  })

  onUnmounted(() => {
    cancelAnimationFrame(rafId)
    window.removeEventListener('resize', resizeCharts)
    document.removeEventListener('fullscreenchange', handleFullscreenChange)
    window.visualViewport?.removeEventListener('resize', resizeCharts)
    resizeObserver?.disconnect()
    resizeObserver = null
  })

  return { resizeCharts, observeContainers }
}
