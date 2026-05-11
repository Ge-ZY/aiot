import * as echarts from 'echarts'

// 直接导入地图数据，但保持 getter 方式以便后续优化
import chinaGeoJSON from 'chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global/chn-level-1.json'
import chinaCitiesGeoJSON from 'chinese-global-compliant-geodata/dist/src/geojson/countries/as/chn/global/chn-level-2.json'

const getChinaGeoJSON = () => chinaGeoJSON
const getChinaCitiesGeoJSON = () => chinaCitiesGeoJSON

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

// 生成地图数据
const generateMapData = (geoJSON: any) => {
  return geoJSON.features.map((item: any) => ({
    name: item.properties?.name || '',
    value: Math.floor(Math.random() * 1000) + 100
  }))
}

// 根据省份名称筛选市级数据
const getProvinceCitiesGeoJSON = (provinceName: string) => {
  const chinaCitiesGeoJSON = getChinaCitiesGeoJSON()
  const targetProvinceName = provinceNameMap[provinceName] || provinceName
  
  const features = chinaCitiesGeoJSON.features.filter((feature: any) => {
    const province = feature.properties?.province
    return province === targetProvinceName
  })
  
  return {
    ...chinaCitiesGeoJSON,
    features
  }
}

// 创建地图配置
const createMapOption = (mapName: string, geoJSON: any): any => {
  registerMap(mapName, geoJSON)

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
      enterable: true,  // 允许鼠标进入tooltip
      hideDelay: 500,  // 延迟500ms隐藏
      position: (point: [number, number], _params: any, _dom: any, _rect: any, _size: any) => {
        // tooltip 位置调整，离鼠标更近
        return {
          left: point[0] + 10,
          top: point[1] - 10
        };
      },
      formatter: (params: any) => {
        const pigFarm = Math.floor(Math.random() * 11) + 10;  // 10-20
        const chickenFarm = Math.floor(Math.random() * 11) + 10;  // 10-20
        const aquatic = Math.floor(Math.random() * 11) + 10;  // 10-20
        
        const isProvinceLevel = mapName !== 'china';
        
        if (isProvinceLevel) {
          // 市级地图，显示可点击的菜单
          return `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #409eff;">
              ${params.name}
            </div>
            <div class="farm-menu" style="margin-top: 8px;">
              <div class="menu-item" onclick="window.handleFarmClick('pig', '${params.name}')" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(64, 158, 255, 0.3)'" onmouseout="this.style.background='transparent'">
                <span style="color: #fff;">猪场：</span>
                <span style="color: #67c23a; font-weight: bold;">${pigFarm}个</span>
              </div>
              <div class="menu-item" onclick="window.handleFarmClick('chicken', '${params.name}')" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; margin-bottom: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(64, 158, 255, 0.3)'" onmouseout="this.style.background='transparent'">
                <span style="color: #fff;">鸡场：</span>
                <span style="color: #67c23a; font-weight: bold;">${chickenFarm}个</span>
              </div>
              <div class="menu-item" onclick="window.handleFarmClick('aquatic', '${params.name}')" style="padding: 6px 12px; cursor: pointer; border-radius: 4px; transition: all 0.2s;" onmouseover="this.style.background='rgba(64, 158, 255, 0.3)'" onmouseout="this.style.background='transparent'">
                <span style="color: #fff;">水产：</span>
                <span style="color: #67c23a; font-weight: bold;">${aquatic}个</span>
              </div>
            </div>
          `;
        } else {
          // 省级地图，显示普通信息
          return `
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 8px; color: #409eff;">
              ${params.name}
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>猪场：</span>
              <span style="color: #67c23a; font-weight: bold;">${pigFarm}个</span>
            </div>
            <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
              <span>鸡场：</span>
              <span style="color: #67c23a; font-weight: bold;">${chickenFarm}个</span>
            </div>
            <div style="display: flex; justify-content: space-between;">
              <span>水产：</span>
              <span style="color: #67c23a; font-weight: bold;">${aquatic}个</span>
            </div>
          `;
        }
      }
    },
    geo: {
      map: mapName,
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
        name: '地图数据',
        type: 'map',
        map: mapName,
        geoIndex: 0,
        roam: true,
        scaleLimit: {
          min: 0.5,
          max: 5
        },
        data: generateMapData(geoJSON),
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

// 创建中国地图配置
const createChinaMapOption = (): any => {
  return createMapOption('china', getChinaGeoJSON())
}

// 创建省级地图配置
const createProvinceMapOption = (provinceName: string): any => {
  const provinceGeoJSON = getProvinceCitiesGeoJSON(provinceName)
  return createMapOption(provinceName, provinceGeoJSON)
}

export { createChinaMapOption, createProvinceMapOption }
