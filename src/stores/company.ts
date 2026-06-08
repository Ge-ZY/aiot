import { defineStore } from 'pinia'
import { ref } from 'vue'
import { sdk } from '@/utils/sdk'

export interface FactoryType {
  label: string
  value: 'pig' | 'chicken' | 'aquatic' | 'feed'
}

export const factoryTypes: FactoryType[] = [
  { label: '猪场', value: 'pig' },
  { label: '鸡场', value: 'chicken' },
  { label: '水产', value: 'aquatic' },
  { label: '饲料厂', value: 'feed' }
]

export const useCompanyStore = defineStore('company', () => {
  const companies = ref<any[]>([])
  const isLoading = ref(false)
  const hasLoaded = ref(false)
  const selectedFactoryType = ref<'pig' | 'chicken' | 'aquatic'>('pig')
  const currentFactory = ref('')
  const lastLeafNode = ref<any>(null)
  const currentNodeData = ref<any>(null)

  const loadCompanys = async (force = false) => {
    // 如果已经加载过且不是强制刷新，直接返回
    if (!force && hasLoaded.value && companies.value.length > 0) {
      return
    }

    if (isLoading.value) {
      return
    }

    isLoading.value = true
    try {
      const res = await sdk.company.treenode()
      if (res.data && res.data.data) {
        companies.value = res.data.data.map((group: any) => ({
          ...group,
          children: []
        }))
        hasLoaded.value = true
      }
    } catch (err) {
      console.error('Failed to load groups:', err)
    } finally {
      isLoading.value = false
    }
  }

  // 递归查找并更新树节点
  const findAndUpdateNode = (nodes: any[], nodeId: string, children: any[]) => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        node.children = children
        return true
      }
      if (node.children && node.children.length > 0) {
        if (findAndUpdateNode(node.children, nodeId, children)) {
          return true
        }
      }
    }
    return false
  }

  const refreshNodeData = async () => {
    if (!currentNodeData.value) return

    try {
      const res = await sdk.company.treenode(currentNodeData.value.id)
      if (res.data && res.data.data) {
        const newChildren = res.data.data.map((child: any) => ({
          ...child,
          children: []
        }))
        // 直接更新 currentNodeData 的 children
        currentNodeData.value.children = newChildren
      }
    } catch (err) {
      console.error('Failed to refresh node data:', err)
    }
  }

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

  const reset = () => {
    companies.value = []
    hasLoaded.value = false
    currentFactory.value = ''
    lastLeafNode.value = null
    currentNodeData.value = null
  }

  return {
    companies,
    isLoading,
    hasLoaded,
    selectedFactoryType,
    currentFactory,
    lastLeafNode,
    currentNodeData,
    factoryTypes,
    loadCompanys,
    refreshNodeData,
    handleNodeClick,
    reset
  }
})
