export interface MockOrderReceipt {
  orderId: string
  ticker: string
  side: 'buy' | 'sell'
  amountInvested: number
  estimatedShares: number
  priceUsed: number
  fees: number
  totalRequired: number
  buyingPowerBefore: number
  buyingPowerAfter: number
  timestamp: string
  status: 'Mock Filled'
  /** Sell-only fields */
  grossProceeds?: number
  netProceeds?: number
  costBasis?: number
  realizedGainLoss?: number
}
