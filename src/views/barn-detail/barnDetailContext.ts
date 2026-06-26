import type { InjectionKey } from 'vue'
import type { useBarnDetail } from './useBarnDetail'

export const BARN_DETAIL_KEY: InjectionKey<ReturnType<typeof useBarnDetail>> = Symbol('barnDetail')
