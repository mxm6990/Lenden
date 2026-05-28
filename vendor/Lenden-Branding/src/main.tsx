import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrandPreview } from './BrandPreview'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrandPreview />
  </StrictMode>,
)
