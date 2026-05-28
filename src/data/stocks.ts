export interface Stock {
  id: string
  ticker: string
  name: string
  sector: string
  price: number
  change: number
  changePct: number
  about: string
  marketCap: string
  peRatio: string
  dividend: string
  chartPoints: number[]
}

export const DSE_INDEX = {
  name: 'DSEX',
  label: 'Dhaka Stock Exchange',
  value: 6324.18,
  change: 26.42,
  changePct: 0.42,
  status: 'Open' as const,
  closesAt: '2:30 PM',
  hoursLabel: 'Sun–Thu · 10:00 AM–2:30 PM',
}

export const stocks: Stock[] = [
  {
    id: 'gp',
    ticker: 'GP',
    name: 'Grameenphone Ltd.',
    sector: 'Telecom',
    price: 298.5,
    change: 4.2,
    changePct: 1.43,
    about:
      'Grameenphone is Bangladesh\'s largest mobile network operator, serving millions of subscribers nationwide with voice and data services.',
    marketCap: '৳401B',
    peRatio: '14.2',
    dividend: '5.8%',
    chartPoints: [280, 285, 282, 288, 291, 289, 295, 298, 296, 298.5],
  },
  {
    id: 'brac',
    ticker: 'BRACBANK',
    name: 'BRAC Bank Ltd.',
    sector: 'Banking',
    price: 52.8,
    change: 0.3,
    changePct: 0.57,
    about:
      'BRAC Bank is a leading private commercial bank in Bangladesh, focused on retail, SME, and corporate banking.',
    marketCap: '৳48B',
    peRatio: '11.8',
    dividend: '3.2%',
    chartPoints: [50, 51, 50.5, 51.8, 52, 51.5, 52.2, 52.8, 52.4, 52.8],
  },
  {
    id: 'squr',
    ticker: 'SQURPHARMA',
    name: 'Square Pharmaceuticals',
    sector: 'Pharma',
    price: 215.0,
    change: -0.8,
    changePct: -0.37,
    about:
      'Square Pharmaceuticals is one of the largest drug manufacturers in Bangladesh, exporting to 42 countries.',
    marketCap: '৳95B',
    peRatio: '16.5',
    dividend: '2.1%',
    chartPoints: [218, 217, 216, 215.5, 216, 215, 214, 215.5, 215, 215],
  },
  {
    id: 'batbc',
    ticker: 'BATBC',
    name: 'British American Tobacco',
    sector: 'Consumer',
    price: 412.0,
    change: 6.5,
    changePct: 1.6,
    about:
      'BAT Bangladesh manufactures and distributes tobacco products and is a long-standing blue-chip on the DSE.',
    marketCap: '৳62B',
    peRatio: '18.3',
    dividend: '6.4%',
    chartPoints: [395, 400, 398, 405, 408, 406, 410, 412, 409, 412],
  },
  {
    id: 'renata',
    ticker: 'RENATA',
    name: 'Renata Ltd.',
    sector: 'Pharma',
    price: 890.0,
    change: 12.0,
    changePct: 1.37,
    about:
      'Renata produces pharmaceuticals, animal health products, and pesticides for domestic and export markets.',
    marketCap: '৳78B',
    peRatio: '15.1',
    dividend: '1.8%',
    chartPoints: [860, 870, 865, 875, 880, 878, 885, 890, 887, 890],
  },
  {
    id: 'marico',
    ticker: 'MARICO',
    name: 'Marico Bangladesh',
    sector: 'Consumer',
    price: 178.5,
    change: 1.2,
    changePct: 0.68,
    about:
      'Marico Bangladesh is a leading FMCG company known for Parachute coconut oil and other personal care brands.',
    marketCap: '৳32B',
    peRatio: '22.4',
    dividend: '2.5%',
    chartPoints: [172, 174, 173, 175, 176, 175, 177, 178, 177.5, 178.5],
  },
]

export const holdings = [
  { stockId: 'gp', shares: 15, avgCost: 285.0 },
  { stockId: 'brac', shares: 40, avgCost: 49.5 },
  { stockId: 'squr', shares: 8, avgCost: 210.0 },
]

export interface EnrichedHolding {
  stockId: string
  shares: number
  avgCost: number
  stock: Stock
  currentValue: number
  invested: number
  returnAmount: number
  returnPct: number
}

export function getEnrichedHoldings(): EnrichedHolding[] {
  return holdings
    .map((h) => {
      const stock = getStock(h.stockId)
      if (!stock) return null
      const currentValue = h.shares * stock.price
      const invested = h.shares * h.avgCost
      const returnAmount = currentValue - invested
      const returnPct = (returnAmount / invested) * 100
      return { ...h, stock, currentValue, invested, returnAmount, returnPct }
    })
    .filter((h): h is EnrichedHolding => h !== null)
}

export function getStock(id: string): Stock | undefined {
  return stocks.find((s) => s.id === id)
}

export function formatBDT(amount: number, compact = false): string {
  if (compact && amount >= 1000) {
    return `৳${(amount / 1000).toFixed(amount >= 10000 ? 0 : 1)}K`
  }
  return `৳${amount.toLocaleString('en-BD', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`
}

export function formatChange(change: number, pct: number): string {
  const sign = change >= 0 ? '+' : ''
  return `${sign}${change.toFixed(2)} (${sign}${pct.toFixed(2)}%)`
}
