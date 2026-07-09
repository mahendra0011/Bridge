import { Navbar } from './navbar'
import { Footer } from './footer'

export function SiteLayout({ children }) {
  return (
    <div className="min-h-screen bg-white font-sans text-foreground">
      <Navbar />
      {children}
      <Footer />
    </div>
  )
}
