import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function BriefingPage() {
  return (
    <MainLayout title="Daily Briefing">
      <Card>
        <CardHeader>
          <CardTitle>Daily Briefing</CardTitle>
          <CardDescription>
            AI-generated summary of today's videos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No briefing available yet</p>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
