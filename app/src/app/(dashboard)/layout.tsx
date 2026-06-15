import { createClient } from '@/lib/supabase'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <a href="/" className="font-bold text-lg">Copply</a>
          <a href="/config" className="text-sm hover:text-primary">Config</a>
          <a href="/logs" className="text-sm hover:text-primary">Logs</a>
          <a href="/analytics" className="text-sm hover:text-primary">Analytics</a>
          <a href="/billing" className="text-sm hover:text-primary">Billing</a>
          <a href="/keys" className="text-sm hover:text-primary">API Keys</a>
          <a href="/vault" className="text-sm hover:text-primary">Vault</a>
          <a href="/docs" className="text-sm hover:text-primary">Docs</a>
        </div>
        <form action="/auth/signout" method="post">
          <button type="submit" className="text-sm text-muted-foreground hover:text-foreground">
            Sign out
          </button>
        </form>
      </nav>
      <main className="p-6">
        {children}
      </main>
    </div>
  )
}
