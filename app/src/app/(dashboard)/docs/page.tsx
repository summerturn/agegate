import { Metadata } from "next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Documentation — AgeGate",
  description: "Complete documentation for the AgeGate SDK, API, and dashboard.",
};

export default function DocsPage() {
  const verifyUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-age`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Documentation</h1>
        <p className="text-muted-foreground">Integrate AgeGate into your application in minutes.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Quick Start</CardTitle>
          <CardDescription>POST to the verify-age endpoint with your API key</CardDescription>
        </CardHeader>
        <CardContent>
          <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap">
{`curl -X POST ${verifyUrl}
  -H "Content-Type: application/json"
  -d '{
    "apiKey": "ag_your_key_here",
    "userId": "user-123",
    "declaredAge": 25,
    "stateHint": "TX"
  }'`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Response</CardTitle></CardHeader>
        <CardContent>
          <pre className="bg-slate-950 text-slate-50 p-4 rounded-lg text-sm overflow-x-auto">
{`{
  "allowed": true,
  "requiresConsent": false,
  "reason": "Age verification passed: 25 >= 13",
  "state": "TX"
}`}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Error Codes</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-3"><code className="font-mono text-red-600 min-w-40">INVALID_API_KEY</code><span>API key is missing, invalid, or revoked</span></div>
          <div className="flex gap-3"><code className="font-mono text-red-600 min-w-40">RATE_LIMITED</code><span>Daily or MAU limit exceeded — upgrade your plan</span></div>
          <div className="flex gap-3"><code className="font-mono text-red-600 min-w-40">STATE_NOT_SUPPORTED</code><span>State not enabled in your compliance config</span></div>
        </CardContent>
      </Card>
    </div>
  );
}
