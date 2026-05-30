import { ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import { lessons } from '../data/lessons'
import { CompactAppHeader } from '../components/layout/CompactAppHeader'
import { Card } from '../components/ui/Card'

export function LearnScreen() {
  return (
    <>
      <CompactAppHeader title="Learn" subtitle="Invest with confidence" />
      <div className="px-5 pb-4">
        <Card className="mb-5 border-lenden-mint/20 bg-lenden-mint/5 p-4">
          <p className="text-sm font-semibold text-white">New to investing?</p>
          <p className="mt-1 text-xs leading-relaxed text-lenden-muted">
            Start with the basics. Each lesson takes just a few minutes — no jargon, no pressure.
          </p>
        </Card>

        <div className="space-y-3">
          {lessons.map((lesson, i) => (
            <motion.button
              key={lesson.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              className="flex w-full items-center gap-4 rounded-2xl border border-white/5 bg-lenden-card p-4 text-left active:scale-[0.99]"
            >
              <div
                className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${lesson.color}`}
              >
                <lesson.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${lesson.color}`}>
                    {lesson.tag}
                  </span>
                  <span className="text-[10px] text-lenden-muted">{lesson.duration}</span>
                </div>
                <p className="mt-1 text-sm font-bold text-white">{lesson.title}</p>
                <p className="mt-0.5 line-clamp-2 text-xs text-lenden-muted">{lesson.description}</p>
              </div>
              <ChevronRight className="h-4 w-4 shrink-0 text-lenden-muted" />
            </motion.button>
          ))}
        </div>
      </div>
    </>
  )
}
