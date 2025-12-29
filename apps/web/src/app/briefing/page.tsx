'use client'

import { useState } from 'react'
import { Calendar, Loader2, Sparkles } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBriefing, useGenerateBriefing } from '@/hooks/useBriefing'

export default function BriefingPage() {
  const today = new Date().toISOString().split('T')[0]
  const [selectedDate, setSelectedDate] = useState(today)

  const { data: briefing, isLoading, error } = useBriefing(selectedDate)
  const { mutate: generateBriefing, isPending: isGenerating } = useGenerateBriefing()

  const handleGenerate = () => {
    generateBriefing(selectedDate)
  }

  return (
    <MainLayout title="Daily Briefing">
      <div className="space-y-6">
        {/* Date Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Select Date</CardTitle>
            <CardDescription>
              Choose a date to view or generate briefing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4 items-end">
              <div className="flex-1 max-w-xs space-y-2">
                <Label htmlFor="date">Date</Label>
                <div className="relative">
                  <Input
                    id="date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    max={today}
                  />
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Briefing
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Briefing Content */}
        <Card>
          <CardHeader>
            <CardTitle>
              {briefing?.title || `Briefing for ${selectedDate}`}
            </CardTitle>
            <CardDescription>
              AI-generated summary of the day&apos;s videos
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground space-y-4">
                <p>No briefing available for this date</p>
                <p className="text-sm">Click &quot;Generate Briefing&quot; to create one</p>
              </div>
            ) : briefing ? (
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: briefing.content.replace(/\n/g, '<br />') }}
                />
              </div>
            ) : (
              <div className="flex items-center justify-center h-64 text-muted-foreground">
                <p>Select a date to view briefing</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  )
}
