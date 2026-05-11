import * as echarts from 'echarts'
import type { EChartsOption } from 'echarts'
import chinaGeoJSON from 'chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global/chn-level-1.json'

// 生成地图数据
const generateMapData = () => {
  return chinaGeoJSON.features.map(item => ({
    name: item.properties?.name || '',
    value: Math.floor(Math.random() * 1000) + 100
  }))
}

// 创建中国地图配置
const createChinaMapOption = (): EChartsOption => {
  // 注册地图
  echarts.registerMap('china', chinaGeoJSON as any)

  return {
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(30, 41, 59, 0.95)',
      borderColor: '#409eff',
      borderWidth: 1,
      padding: [12, 16],
      textStyle: {
        color: '#fff',
        fontSize: 14
      },
      formatter: (params: any) => {
        return `
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #409eff;">
            ${params.name}
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span>数据值：</span>
            <span style="color: #67c23a; font-weight: bold;">${params.value || '-'}</span>
          </div>
        `
      }
    },
    geo: {
      map: 'china',
      roam: true,
      zoom: 1.2,
      scaleLimit: {
        min: 0.5,
        max: 5
      },
      layoutCenter: ['50%', '50%'],
      layoutSize: '85%',
      label: {
        show: true,
        color: '#fff',
        fontSize: 10
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold'
        },
        itemStyle: {
          areaColor: 'rgba(64, 158, 255, 0.7)',
          shadowColor: 'rgba(64, 158, 255, 0.5)',
          shadowBlur: 15,
          shadowOffsetX: 0,
          shadowOffsetY: 0
        }
      },
      itemStyle: {
        borderColor: '#409eff',
        borderWidth: 1,
        shadowColor: 'rgba(64, 158, 255, 0.3)',
        shadowOffsetY: 3,
        shadowBlur: 10,
        areaColor: {
          type: 'linear',
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            { offset: 0, color: 'rgba(64, 158, 255, 0.15)' },
            { offset: 0.5, color: 'rgba(64, 158, 255, 0.25)' },
            { offset: 1, color: 'rgba(64, 158, 255, 0.35)' }
          ]
        }
      }
    },
    series: [
      {
        name: '中国地图',
        type: 'map',
        map: 'china',
        geoIndex: 0,
        roam: true,
        scaleLimit: {
          min: 0.5,
          max: 5
        },
        data: generateMapData(),
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold'
          },
          itemStyle: {
            areaColor: 'rgba(64, 158, 255, 0.7)',
            shadowColor: 'rgba(64, 158, 255, 0.6)',
            shadowBlur: 20,
            shadowOffsetX: 0,
            shadowOffsetY: 0
          }
        }
      }
    ]
  }
}

export default createChinaMapOption

