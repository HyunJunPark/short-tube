'use client'

import { Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { AddChannelForm } from '@/components/dashboard/AddChannelForm'
import { ChannelCard } from '@/components/dashboard/ChannelCard'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useSummaries } from '@/hooks/useSummaries'

export default function Home() {
  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useSubscriptions()
  const { data: allSummaries = [] } = useSummaries()

  const activeChannels = subscriptions.filter((s) => s.is_active).length
  const totalSummaries = allSummaries.length

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Stats Overview */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Channels
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{subscriptions.length}</div>
              <p className="text-xs text-muted-foreground">
                {activeChannels} active
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Videos Monitored
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {subscriptions.reduce((acc, sub) => {
                  // This is a placeholder - in real app would count from video cache
                  return acc
                }, 0)}
              </div>
              <p className="text-xs text-muted-foreground">
                Last 7 days
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Summaries Generated
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalSummaries}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Add Channel Form */}
        <AddChannelForm />

        {/* Channel List */}
        {isLoadingSubscriptions ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : subscriptions.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
              <p>Add your first channel to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {subscriptions.map((subscription) => (
              <ChannelCard key={subscription.channel_id} subscription={subscription} />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
