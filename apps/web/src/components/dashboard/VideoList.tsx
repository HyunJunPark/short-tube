'use client'

import { Loader2, ExternalLink, FileText, Subtitles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import type { Video } from '@short-tube/types'
import { useGenerateSummary, useSummary } from '@/hooks/useSummaries'
import { useState } from 'react'

interface VideoListProps {
  videos: Video[]
  channelTags: string[]
}

interface SummaryResult {
  videoTitle: string
  content: string
}

function VideoItem({ video, channelTags }: { video: Video; channelTags: string[] }) {
  const { data: existingSummary } = useSummary(video.id)
  const { mutate: generateSummary, isPending } = useGenerateSummary()
  const [generatingVideoId, setGeneratingVideoId] = useState<string | null>(null)
  const [summaryResult, setSummaryResult] = useState<SummaryResult | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const handleGenerateSummary = (videoId: string, videoTitle: string) => {
    setGeneratingVideoId(videoId)
    generateSummary(
      { videoId, tags: channelTags },
      {
        onSuccess: (data) => {
          setSummaryResult({
            videoTitle,
            content: data.content,
          })
          setDialogOpen(true)
          setGeneratingVideoId(null)
        },
        onError: () => {
          setGeneratingVideoId(null)
        },
      }
    )
  }

  const handleViewSummary = () => {
    if (existingSummary) {
      setSummaryResult({
        videoTitle: existingSummary.title,
        content: existingSummary.content,
      })
      setDialogOpen(true)
    }
  }

  return (
    <>
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{summaryResult?.videoTitle}</DialogTitle>
            <DialogDescription>AI-generated summary</DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none">
            <div className="whitespace-pre-wrap text-sm">
              {summaryResult?.content}
            </div>
          </div>
        </DialogContent>
      </Dialog>

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
          <div className="flex gap-2 shrink-0">
            <Badge variant="secondary">
              {video.duration}
            </Badge>
            <Badge variant={video.has_caption ? 'default' : 'outline'}>
              <Subtitles className="mr-1 h-3 w-3" />
              {video.has_caption ? '자막' : '자막없음'}
            </Badge>
          </div>
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
          {existingSummary ? (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={handleViewSummary}
            >
              <FileText className="mr-2 h-3 w-3" />
              View Summary
            </Button>
          ) : (
            <Button
              size="sm"
              variant="default"
              className="flex-1"
              onClick={() => handleGenerateSummary(video.id, video.title)}
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
          )}
        </div>
      </div>
    </>
  )
}

export function VideoList({ videos, channelTags }: VideoListProps) {
  const [displayCount, setDisplayCount] = useState(2)

  if (videos.length === 0) {
    return (
      <div className="text-sm text-muted-foreground text-center py-8">
        No videos found in the last 7 days
      </div>
    )
  }

  const visibleVideos = videos.slice(0, displayCount)
  const hasMore = displayCount < videos.length

  const handleLoadMore = () => {
    setDisplayCount(prev => Math.min(prev + 2, videos.length))
  }

  return (
    <div className="space-y-3">
      {visibleVideos.map((video, index) => (
        <div key={video.id}>
          {index > 0 && <Separator className="my-3" />}
          <VideoItem video={video} channelTags={channelTags} />
        </div>
      ))}
      
      {hasMore && (
        <>
          <Separator className="my-4" />
          <div className="flex justify-center pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleLoadMore}
            >
              Load More ({videos.length - displayCount} more)
            </Button>
          </div>
        </>
      )}
    </div>
  )
}
