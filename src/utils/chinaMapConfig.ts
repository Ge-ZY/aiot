import * as echarts from 'echarts'

// 直接导入地图数据，保证稳定性
import chinaGeoJSON from 'chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global/chn-level-1.json'
import chinaCitiesGeoJSON from 'chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global/chn-level-2.json'

const getChinaGeoJSON = (): any => sanitizeGeoJSON(chinaGeoJSON)
const getChinaCitiesGeoJSON = (): any => sanitizeGeoJSON(chinaCitiesGeoJSON)

export interface CityFarm {
  id: number
  name: string
  status: '正常' | '报警'
  alarmCount?: number
}

export interface AlarmMapProvider {
  getProvinceAlarmCount: (provinceName: string) => number
  getCityFarms: (cityName: string) => CityFarm[]
}

interface MapDataItem {
  name: string
  value: number
}

const BOUNDARY_LINE_NAME = '境界线'

/** 过滤 GeoJSON 中的境界线要素，避免地图上重复出现「境界线」字样 */
const sanitizeGeoJSON = (geoJSON: any) => ({
  ...geoJSON,
  features: geoJSON.features.filter(
    (feature: any) => feature.properties?.name !== BOUNDARY_LINE_NAME
  ),
})

const formatRegionLabel = (name?: string) => {
  if (!name || name === BOUNDARY_LINE_NAME) return ''
  return name
}

// 省份名称映射表（用于匹配 chn-level-1 和 chn-level-2 的名称）
const provinceNameMap: Record<string, string> = {
  '北京': '北京市',
  '天津': '天津市',
  '上海': '上海市',
  '重庆': '重庆市',
  '河北': '河北省',
  '山西': '山西省',
  '辽宁': '辽宁省',
  '吉林': '吉林省',
  '黑龙江': '黑龙江省',
  '江苏': '江苏省',
  '浙江': '浙江省',
  '安徽': '安徽省',
  '福建': '福建省',
  '江西': '江西省',
  '山东': '山东省',
  '河南': '河南省',
  '湖北': '湖北省',
  '湖南': '湖南省',
  '广东': '广东省',
  '海南': '海南省',
  '四川': '四川省',
  '贵州': '贵州省',
  '云南': '云南省',
  '陕西': '陕西省',
  '甘肃': '甘肃省',
  '青海': '青海省',
  '台湾': '台湾省',
  '内蒙古': '内蒙古自治区',
  '广西': '广西壮族自治区',
  '西藏': '西藏自治区',
  '宁夏': '宁夏回族自治区',
  '新疆': '新疆维吾尔自治区',
  '香港': '香港特别行政区',
  '澳门': '澳门特别行政区'
}

// 缓存注册过的地图集合
const registeredMaps = new Set<string>()

// 注册地图
const registerMap = (mapName: string, geoJSON: any) => {
  if (!registeredMaps.has(mapName)) {
    echarts.registerMap(mapName, geoJSON)
    registeredMaps.add(mapName)
  }
}

const menuItemStyle = 'padding: 6px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; transition: all 0.2s; display: flex; justify-content: space-between; align-items: center;'
const menuItemHover = "onmouseover=\"this.style.background='rgba(64, 158, 255, 0.3)'\" onmouseout=\"this.style.background='transparent'\""

const getFarmStatusLabel = (farm: CityFarm) => {
  const isAlarm = farm.status === '报警'
  const color = isAlarm ? '#f56c6c' : '#67c23a'
  const text = isAlarm && farm.alarmCount ? `报警 ${farm.alarmCount}条` : farm.status
  return `<span style="color: ${color}; font-weight: bold; font-size: 12px; margin-left: 8px; flex-shrink: 0;">${text}</span>`
}

// 生成地图数据（按报警数量着色）
const generateMapData = (geoJSON: any, provider: AlarmMapProvider | undefined, isCityLevel: boolean): MapDataItem[] => {
  return geoJSON.features.map((item: any) => {
    const name = item.properties?.name || ''
    if (name === BOUNDARY_LINE_NAME) return null
    let value = 0
    if (provider) {
      value = isCityLevel
        ? provider.getCityFarms(name)
            .filter(f => f.status === '报警')
            .reduce((sum, f) => sum + (f.alarmCount ?? 1), 0)
        : provider.getProvinceAlarmCount(name)
    } else {
      value = Math.floor(Math.random() * 30)
    }
    return { name, value }
  }).filter((item: MapDataItem | null): item is MapDataItem => item !== null)
}

// 根据省份名称筛选市级数据
const getProvinceCitiesGeoJSON = (provinceName: string): any => {
  const citiesGeoJSON = getChinaCitiesGeoJSON()
  const targetProvinceName = provinceNameMap[provinceName] || provinceName

  const features = citiesGeoJSON.features.filter((feature: any) => {
    const name = feature.properties?.name
    if (name === BOUNDARY_LINE_NAME) return false
    const province = feature.properties?.province
    return province === targetProvinceName
  })

  return {
    ...citiesGeoJSON,
    features
  }
}

// 创建地图配置
const createMapOption = (mapName: string, geoJSON: any, provider?: AlarmMapProvider): any => {
  registerMap(mapName, geoJSON)
  const isCityLevel = mapName !== 'china'
  const mapData = generateMapData(geoJSON, provider, isCityLevel)
  const maxAlarm = Math.max(...mapData.map((d: MapDataItem) => d.value), 1)

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
      enterable: true,
      hideDelay: 500,
      position: (point: [number, number]) => ({
        left: point[0] + 10,
        top: point[1] - 10
      }),
      formatter: (params: any) => {
        const regionName = params.name

        if (isCityLevel && provider) {
          const farms = provider.getCityFarms(regionName)
          const farmItems = farms.length > 0
            ? farms.map(farm => `
              <div class="menu-item" onclick="window.handleFarmClick(${farm.id})" style="${menuItemStyle}" ${menuItemHover}>
                <span style="color: #fff;">${farm.name}</span>
                ${getFarmStatusLabel(farm)}
              </div>
            `).join('')
            : `<div style="color: rgba(255,255,255,0.6); padding: 4px 0;">暂无工厂数据</div>`

          return `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #409eff;">
              ${regionName}
            </div>
            <div style="font-size: 13px; color: rgba(255,255,255,0.7); margin-bottom: 6px;">工厂列表（点击查看）：</div>
            <div class="farm-menu" style="margin-top: 4px;">
              ${farmItems}
            </div>
          `
        }

        const alarmCount = provider ? provider.getProvinceAlarmCount(regionName) : 0
        const alarmColor = alarmCount > 0 ? '#f56c6c' : '#67c23a'
        return `
          <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #409eff;">
            ${regionName}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <span>报警数量：</span>
            <span style="color: ${alarmColor}; font-weight: bold; font-size: 18px;">${alarmCount}</span>
          </div>
          <div style="font-size: 12px; color: rgba(255,255,255,0.5); margin-top: 6px;">点击进入查看详情</div>
        `
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max: maxAlarm,
      inRange: {
        color: ['rgba(64, 158, 255, 0.15)', 'rgba(245, 108, 108, 0.6)']
      }
    },
    geo: {
      map: mapName,
      roam: true,
      zoom: 0.95,
      scaleLimit: {
        min: 0.5,
        max: 5
      },
      layoutCenter: ['50%', '50%'],
      layoutSize: '86%',
      label: {
        show: true,
        color: '#fff',
        fontSize: 10,
        formatter: (params: { name?: string }) => formatRegionLabel(params.name),
      },
      emphasis: {
        label: {
          show: true,
          color: '#fff',
          fontSize: 12,
          fontWeight: 'bold',
          formatter: (params: { name?: string }) => formatRegionLabel(params.name),
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
        name: '报警数据',
        type: 'map',
        map: mapName,
        geoIndex: 0,
        roam: true,
        scaleLimit: {
          min: 0.5,
          max: 5
        },
        data: mapData,
        label: {
          show: false,
        },
        emphasis: {
          label: {
            show: true,
            color: '#fff',
            fontSize: 12,
            fontWeight: 'bold',
            formatter: (params: { name?: string }) => formatRegionLabel(params.name),
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

// 创建中国地图配置
const createChinaMapOption = (provider?: AlarmMapProvider): any => {
  const geoJSON = getChinaGeoJSON()
  return createMapOption('china', geoJSON, provider)
}

// 创建省级地图配置
const createProvinceMapOption = (provinceName: string, provider?: AlarmMapProvider): any => {
  const provinceGeoJSON = getProvinceCitiesGeoJSON(provinceName)
  return createMapOption(provinceName, provinceGeoJSON, provider)
}

export { createChinaMapOption, createProvinceMapOption }
