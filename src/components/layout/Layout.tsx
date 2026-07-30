import { Footer } from './Footer'
import { Header } from './Header'
import { Sidebar } from './Sidebar'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <div className="flex flex-1">
        <Sidebar />
        <main className="mx-auto flex w-full flex-1 px-6 py-8">{children}</main>
      </div>
      <Footer />
    </div>
  )
}
