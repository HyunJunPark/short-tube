'use client'

import { Trash2, ChevronDown, RefreshCw, Loader2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import type { Subscription } from '@short-tube/types'
import { useUpdateSubscription, useDeleteSubscription } from '@/hooks/useSubscriptions'
import { useVideos, useRefreshVideos } from '@/hooks/useVideos'
import { TagSelector } from './TagSelector'
import { VideoList } from './VideoList'
import { useState } from 'react'

interface ChannelCardProps {
  subscription: Subscription
}

export function ChannelCard({ subscription }: ChannelCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const { mutate: updateSubscription } = useUpdateSubscription()
  const { mutate: deleteSubscription, isPending: isDeleting } = useDeleteSubscription()
  const { data: allVideos = [], isLoading: isLoadingVideos } = useVideos(subscription.channel_id)
  const { mutate: refreshVideos, isPending: isRefreshing } = useRefreshVideos()

  // Filter videos to show only those from the last 7 days
  const sevenDaysAgo = new Date()
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
  
  const videos = allVideos.filter(video => {
    const publishDate = new Date(video.published_at)
    return publishDate >= sevenDaysAgo
  })

  const handleToggleActive = (checked: boolean) => {
    updateSubscription({
      ...subscription,
      is_active: checked,
    })
  }

  const handleTagsChange = (tags: string[]) => {
    updateSubscription({
      ...subscription,
      tags,
    })
  }

  const handleDelete = () => {
    deleteSubscription(subscription.channel_id, {
      onSuccess: () => {
        setDeleteDialogOpen(false)
      },
    })
  }

  const handleRefresh = () => {
    refreshVideos(subscription.channel_id)
  }

  return (
    <Card className="relative">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <CardTitle className="text-lg flex items-center gap-2">
              {subscription.channel_name}
              {!subscription.is_active && (
                <Badge variant="secondary" className="font-normal">
                  Inactive
                </Badge>
              )}
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              ID: {subscription.channel_id}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Switch
              checked={subscription.is_active}
              onCheckedChange={handleToggleActive}
            />
            <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Channel</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to remove &quot;{subscription.channel_name}&quot; from your
                    subscriptions? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setDeleteDialogOpen(false)}
                    disabled={isDeleting}
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={isDeleting}
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      'Delete'
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <TagSelector selectedTags={subscription.tags} onChange={handleTagsChange} />

        <Accordion type="single" collapsible>
          <AccordionItem value="videos" className="border-none">
            <AccordionTrigger className="py-3 text-sm font-medium hover:no-underline">
              <div className="flex items-center gap-2">
                Recent Videos (Last 7 days)
                <Badge variant="secondary">{videos.length}</Badge>
              </div>
            </AccordionTrigger>
            <AccordionContent className="pt-2">
              <div className="space-y-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRefresh}
                  disabled={isRefreshing}
                  className="w-full"
                >
                  {isRefreshing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Refresh Videos
                    </>
                  )}
                </Button>

                {isLoadingVideos ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <VideoList videos={videos} channelTags={subscription.tags} />
                )}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  )
}
