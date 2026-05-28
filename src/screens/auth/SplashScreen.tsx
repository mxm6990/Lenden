import { motion } from 'framer-motion'
import { useApp } from '../../context/AppContext'
import { Button } from '../../components/ui/Button'
import { SplashHero } from '../../components/SplashHero'

export function SplashScreen() {
  const { goToAuth, enterDemo } = useApp()

  return (
    <div className="relative flex h-svh max-h-svh flex-col overflow-hidden bg-lenden-black">
      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden px-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <SplashHero />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.15 }}
        className="relative shrink-0 px-6 safe-bottom-lg"
      >
        <div className="mx-auto w-full max-w-full space-y-3">
          <Button fullWidth size="lg" onClick={() => goToAuth('signup')}>
            Create Account
          </Button>
          <Button fullWidth size="lg" variant="secondary" onClick={enterDemo}>
            Explore Demo
          </Button>
        </div>
      </motion.div>
    </div>
  )
}
