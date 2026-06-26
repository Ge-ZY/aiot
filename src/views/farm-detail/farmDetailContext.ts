import type { InjectionKey } from 'vue'
import type { useFarmDetail } from './useFarmDetail'

export const FARM_DETAIL_KEY: InjectionKey<ReturnType<typeof useFarmDetail>> = Symbol('farmDetail')
