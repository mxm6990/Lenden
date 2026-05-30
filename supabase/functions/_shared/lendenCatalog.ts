/** Lenden prototype stock catalog — tickers must match DSE TRADING_CODE values. */
export interface LendenCatalogEntry {
  stockId: string
  ticker: string
  name: string
  mockPrice: number
  mockChange: number
  mockChangePercent: number
  mockVolume: number
}

export const EXPERIMENTAL_DSE_DISCLAIMER =
  'Experimental DSE data for paper trading only. Verify licensing before production use.'

export const LENDEN_STOCK_CATALOG: LendenCatalogEntry[] = [
  {
    stockId: 'gp',
    ticker: 'GP',
    name: 'Grameenphone Ltd.',
    mockPrice: 298.5,
    mockChange: 4.2,
    mockChangePercent: 1.43,
    mockVolume: 2_840_000,
  },
  {
    stockId: 'brac',
    ticker: 'BRACBANK',
    name: 'BRAC Bank Ltd.',
    mockPrice: 52.8,
    mockChange: 0.3,
    mockChangePercent: 0.57,
    mockVolume: 4_520_000,
  },
  {
    stockId: 'squr',
    ticker: 'SQURPHARMA',
    name: 'Square Pharmaceuticals',
    mockPrice: 215.0,
    mockChange: -0.8,
    mockChangePercent: -0.37,
    mockVolume: 890_000,
  },
  {
    stockId: 'batbc',
    ticker: 'BATBC',
    name: 'British American Tobacco',
    mockPrice: 412.0,
    mockChange: 6.5,
    mockChangePercent: 1.6,
    mockVolume: 520_000,
  },
  {
    stockId: 'renata',
    ticker: 'RENATA',
    name: 'Renata Ltd.',
    mockPrice: 890.0,
    mockChange: 12.0,
    mockChangePercent: 1.37,
    mockVolume: 198_000,
  },
  {
    stockId: 'marico',
    ticker: 'MARICO',
    name: 'Marico Bangladesh',
    mockPrice: 178.5,
    mockChange: 1.2,
    mockChangePercent: 0.68,
    mockVolume: 310_000,
  },
]

export function findCatalogEntry(input: { stockId?: string | null; ticker?: string | null }) {
  if (input.stockId) {
    const byId = LENDEN_STOCK_CATALOG.find((entry) => entry.stockId === input.stockId)
    if (byId) return byId
  }

  if (input.ticker) {
    const normalized = input.ticker.trim().toUpperCase()
    return LENDEN_STOCK_CATALOG.find((entry) => entry.ticker.toUpperCase() === normalized) ?? null
  }

  return null
}
