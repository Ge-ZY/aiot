import { ref, watch, onMounted } from 'vue'
import { sdk } from '@/utils/sdk'

export interface FactoryType {
  label: string
  value: 'pig' | 'chicken' | 'aquatic'
}

export const factoryTypes: FactoryType[] = [
  { label: '猪场', value: 'pig' },
  { label: '鸡场', value: 'chicken' },
  { label: '水产', value: 'aquatic' }
]

// 单例状态：所有组件共享同一份状态
const companies = ref<any[]>([])
const filterText = ref('')
const companyTree = ref()
const currentNodeData = ref<any>(null)
const lastLeafNode = ref<any>(null)
const currentFactory = ref('')
const selectedFactoryType = ref<'pig' | 'chicken' | 'aquatic'>('pig')

// 用于标记是否已加载过公司列表
let hasLoadedCompanies = false
// 用于防止并发请求
let isLoadingCompanies = false
// 存储正在进行的请求 Promise
let loadingPromise: Promise<void> | null = null

// 显式使用 isLoadingCompanies 以避免 TypeScript 报错
void isLoadingCompanies

export function useCompanyTree() {
  const filterNode = (value: string, data: any) => {
    if (!value) return true
    return data.name.includes(value) || data.code.includes(value)
  }

  watch(filterText, (val) => {
    companyTree.value?.filter(val)
  })

  const handleNodeClick = async (data: any) => {
    currentNodeData.value = data
    if (data.children.length === 0) {
      await refreshNodeData()
    }

    const isLeafNode = !data.children || data.children.length === 0
    
    if (isLeafNode) {
      lastLeafNode.value = data
      currentFactory.value = data.name
      console.log('点击叶子节点，:', data)
    } else {
      if (lastLeafNode.value) {
        currentFactory.value = lastLeafNode.value.name
      }
    }
  }

  const refreshNodeData = async () => {
    if (!currentNodeData.value) return
    
    try {
      const res = await sdk.company.treenode(currentNodeData.value.id)
      if (res.data && res.data.data) {
        currentNodeData.value.children = res.data.data.map((child: any) => ({
          ...child,
          children: []
        }))
        companyTree.value?.updateKeyChildren(currentNodeData.value.id, currentNodeData.value.children)
      }
    } catch (err) {
      console.error('Failed to refresh node data:', err)
    }
  }

  const loadCompanys = async () => {
    // 如果已加载过，直接返回
    if (hasLoadedCompanies && companies.value.length > 0) {
      return
    }

    // 如果有正在进行的请求，等待它完成
    if (loadingPromise) {
      return loadingPromise
    }

    // 如果已有数据，直接返回
    if (companies.value.length > 0) {
      return
    }

    // 标记开始加载
    isLoadingCompanies = true

    const doLoad = async () => {
      try {
        const res = await sdk.company.treenode()
        if (res.data && res.data.data) {
          companies.value = res.data.data.map((group: any) => ({
            ...group,
            children: []
          }))
          hasLoadedCompanies = true
        }
      } catch (err) {
        console.error('Failed to load groups:', err)
      } finally {
        isLoadingCompanies = false
        loadingPromise = null
      }
    }

    // 创建并保存请求 Promise
    loadingPromise = doLoad()
    return loadingPromise
  }

  onMounted(async () => {
    await loadCompanys()
  })

  return {
    companies,
    filterText,
    companyTree,
    currentNodeData,
    lastLeafNode,
    currentFactory,
    selectedFactoryType,
    factoryTypes,
    filterNode,
    handleNodeClick,
    refreshNodeData,
    loadCompanys
  }
}
