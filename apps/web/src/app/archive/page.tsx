import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function ArchivePage() {
  return (
    <MainLayout title="Archive">
      <Card>
        <CardHeader>
          <CardTitle>Summary Archive</CardTitle>
          <CardDescription>
            Browse and search past video summaries
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-64 text-muted-foreground">
            <p>No summaries archived yet</p>
          </div>
        </CardContent>
      </Card>
    </MainLayout>
  )
}
