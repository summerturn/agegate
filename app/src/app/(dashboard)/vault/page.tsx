'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Shield, Trash2, Clock, AlertTriangle, CheckCircle } from 'lucide-react'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function PrivacyVaultPage() {
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [complianceScore, setComplianceScore] = useState(0)

  useEffect(() => {
    loadStats()
  }, [])

  async function loadStats() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Get verification stats
    const { data: verifications } = await supabase
      .from('verification_requests')
      .select('result, deleted_at, created_at')
      .eq('developer_id', user.id)

    // Get consent stats
    const { data: consents } = await supabase
      .from('consent_records')
      .select('consent_status, expires_at, created_at')
      .eq('developer_id', user.id)

    // Get deletion logs
    const { data: deletions } = await supabase
      .from('deletion_logs')
      .select('*')
      .eq('developer_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10)

    const totalVerifications = verifications?.length || 0
    const activeVerifications = verifications?.filter((v: any) => !v.deleted_at).length || 0
    const deletedVerifications = verifications?.filter((v: any) => v.deleted_at).length || 0
    const activeConsents = consents?.filter((c: any) => c.consent_status === 'verified').length || 0
    const expiredConsents = consents?.filter((c: any) => c.consent_status === 'expired').length || 0
    const pendingConsents = consents?.filter((c: any) => c.consent_status === 'pending').length || 0

    setStats({
      totalVerifications,
      activeVerifications,
      deletedVerifications,
      activeConsents,
      expiredConsents,
      pendingConsents,
      deletions: deletions || [],
    })

    // Calculate compliance score
    let score = 70 // Base score
    if (activeConsents === 0 && expiredConsents > 0) score += 15 // Good deletion hygiene
    if (deletedVerifications > 0) score += 10 // Actually deleting data
    if (pendingConsents === 0) score += 5 // No pending consents
    setComplianceScore(Math.min(100, score))

    setLoading(false)
  }

  if (loading) return <div className="p-8">Loading privacy vault...</div>

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Shield className="w-6 h-6 text-emerald-500" />
          Privacy Vault
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Compliance Score:</span>
          <span className={`text-lg font-bold ${complianceScore >= 90 ? 'text-emerald-500' : complianceScore >= 70 ? 'text-amber-500' : 'text-red-500'}`}>
            {complianceScore}/100
          </span>
        </div>
      </div>

      <Progress value={complianceScore} className="h-2" />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              Active Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.activeVerifications}</div>
            <p className="text-xs text-muted-foreground">Currently stored</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-blue-500" />
              Deleted Verifications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deletedVerifications}</div>
            <p className="text-xs text-muted-foreground">Auto-deleted per TX HB 18</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-500" />
              Expiring Soon
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingConsents}</div>
            <p className="text-xs text-muted-foreground">Pending consent responses</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Deletion Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          {stats.deletions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No deletion events yet. Data will be automatically deleted when consent expires.</p>
          ) : (
            <div className="space-y-2">
              {stats.deletions.map((deletion: any) => (
                <div key={deletion.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Hash: {deletion.deletion_hash.slice(0, 16)}...</p>
                    <p className="text-xs text-muted-foreground">{deletion.reason}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm">{deletion.verifications_deleted} verifications</p>
                    <p className="text-sm">{deletion.consents_deleted} consents</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="bg-muted p-4 rounded-lg">
        <h3 className="font-semibold mb-2">What Texas HB 18 Requires</h3>
        <ul className="text-sm space-y-1 text-muted-foreground">
          <li>• Delete all age verification data after parental consent expires</li>
          <li>• Maintain audit trail of deletions (hash-based, not PII)</li>
          <li>• Allow users to request deletion at any time</li>
          <li>• Soft-delete verifications (recoverable for 30 days), hard-delete consents</li>
        </ul>
      </div>
    </div>
  )
}
