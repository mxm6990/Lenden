import { SiteNav, HeroSection } from './components/sections/HeroSection'
import { FeatureSection } from './components/sections/FeatureSection'
import { ShowcaseSection } from './components/sections/ShowcaseSection'
import { BetaSection } from './components/sections/BetaSection'
import { SiteFooter } from './components/sections/SiteFooter'

export function App() {
  return (
    <>
      <SiteNav />
      <main>
        <HeroSection />
        <FeatureSection />
        <ShowcaseSection />
        <BetaSection />
      </main>
      <SiteFooter />
    </>
  )
}
