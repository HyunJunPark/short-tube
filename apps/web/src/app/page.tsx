'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

import { ChannelCard } from '@/components/dashboard/ChannelCard'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useSummaries } from '@/hooks/useSummaries'
import { useVideoStats } from '@/hooks/useVideos'
import { useCheckNewVideos } from '@/hooks/useCheckNewVideos'
import { AVAILABLE_CATEGORIES } from '@short-tube/types'

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  const { data: subscriptions = [], isLoading: isLoadingSubscriptions } = useSubscriptions()
  const { data: allSummaries = [] } = useSummaries()
  const { data: videoStats } = useVideoStats()
  const { data: newVideosData } = useCheckNewVideos()

  const activeChannels = subscriptions.filter((s) => s.is_active).length
  const totalSummaries = allSummaries.length
  const totalVideos = videoStats?.total_videos || 0
  const todayVideos = videoStats?.today_video_count || 0
  const totalNewVideos = newVideosData?.totalNewVideos || 0

  // Filtered subscriptions based on selected category
  const filteredSubscriptions = useMemo(() => {
    if (selectedCategory === 'all') {
      return subscriptions
    }
    return subscriptions.filter((sub) =>
      (sub.categories || []).includes(selectedCategory)
    )
  }, [subscriptions, selectedCategory])

  // Collect all unique categories from subscriptions
  const allCategories = useMemo(() => {
    const categoriesSet = new Set<string>()
    subscriptions.forEach((sub) => {
      (sub.categories || []).forEach((category) => categoriesSet.add(category))
    })
    // Return AVAILABLE_CATEGORIES first, then custom categories
    const customCategories = Array.from(categoriesSet).filter(
      (category) => !AVAILABLE_CATEGORIES.includes(category as any)
    )
    return [...AVAILABLE_CATEGORIES.filter((cat) => categoriesSet.has(cat)), ...customCategories]
  }, [subscriptions])

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: subscriptions.length,
    }
    allCategories.forEach((category) => {
      counts[category] = subscriptions.filter((sub) =>
        (sub.categories || []).includes(category)
      ).length
    })
    return counts
  }, [subscriptions, allCategories])

  return (
    <MainLayout title="Dashboard" notificationCount={totalNewVideos}>
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
                Today Published
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todayVideos}</div>
              <p className="text-xs text-muted-foreground">
                Videos published today
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

        {/* Category Tabs & Channel List */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="all">
              전체 ({categoryCounts.all})
            </TabsTrigger>
            {allCategories.map((category) => (
              <TabsTrigger key={category} value={category}>
                {category} ({categoryCounts[category] || 0})
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="mt-6">
            {isLoadingSubscriptions ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : filteredSubscriptions.length === 0 ? (
              <Card>
                <CardContent className="flex items-center justify-center h-64 text-muted-foreground">
                  <p>
                    {selectedCategory === 'all'
                      ? 'Add your first channel to get started'
                      : `No channels in ${selectedCategory} category`}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredSubscriptions.map((subscription) => (
                  <ChannelCard key={subscription.channel_id} subscription={subscription} />
                ))}
              </div>
            )}
          </div>
        </Tabs>
      </div>
    </MainLayout>
  )
}
