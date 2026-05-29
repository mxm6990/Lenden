/**
 * Past transactions — mock data with API-ready shape.
 * Replace with GET /api/transactions when backend is live.
 */

export type TransactionType = 'buy' | 'sell' | 'deposit' | 'withdrawal' | 'dividend'

export type TransactionStatus = 'completed' | 'pending' | 'failed'

export interface PastTransaction {
  id: string
  userId: string
  date: string
  type: TransactionType
  ticker: string | null
  shares: number | null
  amount: number
  status: TransactionStatus
  note: string | null
  realizedGainLoss?: number | null
}

const MOCK_TRANSACTIONS: PastTransaction[] = [
  {
    id: 'txn_001',
    userId: 'usr_mahathir_001',
    date: '22 May',
    type: 'buy',
    ticker: 'GP',
    shares: 5,
    amount: -1492.5,
    status: 'completed',
    note: 'Market order',
  },
  {
    id: 'txn_002',
    userId: 'usr_mahathir_001',
    date: '14 May',
    type: 'sell',
    ticker: 'BATBC',
    shares: 5,
    amount: 1250,
    status: 'completed',
    note: 'Partial exit',
  },
  {
    id: 'txn_003',
    userId: 'usr_mahathir_001',
    date: '8 May',
    type: 'deposit',
    ticker: null,
    shares: null,
    amount: 5000,
    status: 'completed',
    note: 'bKash ··· 4821',
  },
  {
    id: 'txn_004',
    userId: 'usr_mahathir_001',
    date: '2 May',
    type: 'dividend',
    ticker: 'GP',
    shares: null,
    amount: 890,
    status: 'completed',
    note: 'Dividend payout',
  },
  {
    id: 'txn_005',
    userId: 'usr_mahathir_001',
    date: '28 Apr',
    type: 'buy',
    ticker: 'BRACBANK',
    shares: 20,
    amount: -990,
    status: 'completed',
    note: 'Limit order',
  },
]

export function getPastTransactions(): PastTransaction[] {
  return [...MOCK_TRANSACTIONS]
}

export async function fetchPastTransactions(): Promise<PastTransaction[]> {
  // const res = await fetch('/api/transactions')
  // return res.json()
  return getPastTransactions()
}

export function getTransactionLabel(type: TransactionType): string {
  const labels: Record<TransactionType, string> = {
    buy: 'Buy',
    sell: 'Sell',
    deposit: 'Deposit',
    withdrawal: 'Withdrawal',
    dividend: 'Dividend',
  }
  return labels[type]
}
