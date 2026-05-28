import { BookOpen, Building2, LineChart, Scale, TrendingUp } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface Lesson {
  id: string
  title: string
  description: string
  duration: string
  tag: string
  icon: LucideIcon
  color: string
}

export const lessons: Lesson[] = [
  {
    id: 'dse',
    title: 'What is the DSE?',
    description:
      'Learn how the Dhaka Stock Exchange works, market hours, and what it means to buy a share of a company.',
    duration: '3 min',
    tag: 'Basics',
    icon: Building2,
    color: 'bg-emerald-500/15 text-emerald-400',
  },
  {
    id: 'bo',
    title: 'What is a BO account?',
    description:
      'Understand the Beneficiary Owner account required to hold and trade stocks in Bangladesh.',
    duration: '4 min',
    tag: 'Basics',
    icon: BookOpen,
    color: 'bg-blue-500/15 text-blue-400',
  },
  {
    id: 'prices',
    title: 'How stock prices move',
    description:
      'Discover what drives daily price changes — earnings, news, supply and demand — without the hype.',
    duration: '5 min',
    tag: 'Markets',
    icon: LineChart,
    color: 'bg-amber-500/15 text-amber-400',
  },
  {
    id: 'risk',
    title: 'Risk vs return',
    description:
      'Learn why higher potential returns usually come with higher risk, and how to match both to your goals.',
    duration: '4 min',
    tag: 'Strategy',
    icon: Scale,
    color: 'bg-purple-500/15 text-purple-400',
  },
  {
    id: 'longterm',
    title: 'Long-term investing',
    description:
      'Why patience beats timing the market, and how consistent investing builds wealth over years.',
    duration: '5 min',
    tag: 'Strategy',
    icon: TrendingUp,
    color: 'bg-teal-500/15 text-teal-400',
  },
]
