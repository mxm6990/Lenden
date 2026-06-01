import { CONTACT_EMAIL } from '../../lib/constants'
import { LendenLogo } from '../LendenLogo'

export function SiteFooter() {
  return (
    <footer className="border-t border-white/5 py-12">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <div className="flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <LendenLogo variant="default" />
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-lenden-muted">
              Clarity in every investment. A mobile-first DSE investing prototype built in Bangladesh.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-8 text-sm sm:grid-cols-3">
            <div>
              <p className="font-semibold text-white">Product</p>
              <ul className="mt-3 space-y-2 text-lenden-muted">
                <li>
                  <a href="#features" className="transition hover:text-white">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#app" className="transition hover:text-white">
                    App preview
                  </a>
                </li>
                <li>
                  <a href="#beta" className="transition hover:text-white">
                    Join beta
                  </a>
                </li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-white">Legal</p>
              <ul className="mt-3 space-y-2 text-lenden-muted">
                <li>Prototype only</li>
                <li>Not financial advice</li>
                <li>Mock trading</li>
              </ul>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <p className="font-semibold text-white">Contact</p>
              <a
                href={`mailto:${CONTACT_EMAIL}`}
                className="mt-3 inline-block text-lenden-mint transition hover:text-white"
              >
                {CONTACT_EMAIL}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-10 border-t border-white/5 pt-6">
          <p className="text-xs leading-relaxed text-lenden-muted">
            LenDen is a prototype environment for evaluating retail investing UX on the Dhaka Stock
            Exchange. Securities services require licensed brokerage partnerships and regulatory
            approval. Market data in beta may be delayed or simulated. Past performance does not
            guarantee future results.
          </p>
          <p className="mt-4 text-xs text-lenden-muted/70">
            © {new Date().getFullYear()} LenDen. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}
