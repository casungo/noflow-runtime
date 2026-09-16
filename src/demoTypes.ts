import type { PrimitiveName, WorldState } from './runtime/types'

export type DemoWorldState = WorldState & {
  user: {
    loggedIn: boolean
    hasPaymentMethod: boolean
    trialUsed: boolean
  }
  product: {
    name: string
    price: number
    plan: 'starter' | 'pro' | 'team'
  }
  session: {
    visits: number
    lastSurface: PrimitiveName
  }
}
