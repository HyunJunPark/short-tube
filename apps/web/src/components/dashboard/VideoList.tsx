'use client'

import { Loader2, ExternalLink, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Video } from '@short-tube/types'
import { useGenerateSummary } from '@/hooks/useSummaries'
import { useState } from 'react'

interface VideoListProps {
  videos: Video[]
  channelTags: string[]
}

export function VideoList({ videos, channelTags }: VideoListProps) {
  const { mutate: generateSummary, isPending } = useGenerateSummary()
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null)

  if (videos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No videos found in the last 7 days
      </div>
    )
  }

  const handleGenerateSummary = (videoId: string) => {
    setGeneratingVideoId(videoId)
    generateSummary(
      { videoId, tags: channelTags },
      {
        onSettled: () => {
          setGeneratingVideoId(null)
        },
      }
    )
  }

  return (
    <div className="space-y-3">
      {videos.map((video, index) => (
        <div key={video.id}>
          {index > 0 && <Separator className="my-3" />}
          <div className="space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm line-clamp-2">{video.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(video.published_at).toLocaleDateString('ko-KR', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant="secondary" className="shrink-0">
                {video.duration}
              </Badge>
            </div>

            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                asChild
              >
                <a
                  href={`https://youtube.com/watch?v=${video.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="mr-2 h-3 w-3" />
                  Watch
                </a>
              </Button>
              <Button
                size="sm"
                variant="default"
                className="flex-1"
                onClick={() => handleGenerateSummary(video.id)}
                disabled={isPending && generatingVideoId === video.id}
              >
                {isPending && generatingVideoId === video.id ? (
                  <>
                    <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText className="mr-2 h-3 w-3" />
                    Summarize
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
