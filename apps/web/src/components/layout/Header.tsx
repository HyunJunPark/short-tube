'use client'

import { Bell, Menu, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMarkNotificationsChecked, useCheckNewVideos } from '@/hooks/useCheckNewVideos'
import { useSubscriptions } from '@/hooks/useSubscriptions'
import { useState, useRef, useEffect } from 'react'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  notificationCount?: number
}

export function Header({ title, onMenuClick, notificationCount = 0 }: HeaderProps) {
  const { mutate: markChecked } = useMarkNotificationsChecked()
  const { data: checkNewVideosData } = useCheckNewVideos(false)
  const { data: subscriptions } = useSubscriptions()
  const [isNotificationPanelOpen, setIsNotificationPanelOpen] = useState(false)
  const panelRef = useRef<HTMLDivElement>(null)

  // Close panel when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setIsNotificationPanelOpen(false)
      }
    }

    if (isNotificationPanelOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isNotificationPanelOpen])

  const handleNotificationClick = () => {
    setIsNotificationPanelOpen(!isNotificationPanelOpen)
  }

  const handleMarkAsRead = (channelId?: string) => {
    markChecked(channelId || '*', {
      onSuccess: () => {
        if (!channelId) {
          setIsNotificationPanelOpen(false)
        }
      },
    })
  }

  // Get subscription name by channel ID
  const getChannelName = (channelId: string) => {
    return subscriptions?.find(s => s.channel_id === channelId)?.channel_name || channelId
  }

  // Get new videos by channel
  const newVideosByChannel = checkNewVideosData?.byChannel || {}

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={onMenuClick}
        >
          <Menu className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-bold">{title}</h2>
      </div>

      <div className="flex items-center gap-4 relative">
        <div ref={panelRef} className="relative">
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={handleNotificationClick}
          >
            <Bell className="h-5 w-5" />
            {notificationCount > 0 && (
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-[10px]" variant="destructive">
                {notificationCount > 99 ? '99+' : notificationCount}
              </Badge>
            )}
          </Button>

          {/* Notification Dropdown Panel */}
          {isNotificationPanelOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-background border border-border rounded-lg shadow-lg overflow-hidden">
              <div className="p-4 border-b bg-muted/50 flex items-center justify-between">
                <h3 className="font-semibold text-sm">새 영상</h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsNotificationPanelOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              {notificationCount === 0 ? (
                <div className="p-6 text-center text-sm text-muted-foreground">
                  새로운 영상이 없습니다
                </div>
              ) : (
                <div className="max-h-96 overflow-y-auto">
                  {Object.entries(newVideosByChannel).map(([channelId, count]) => (
                    count > 0 && (
                      <div
                        key={channelId}
                        className="p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {getChannelName(channelId)}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              새 영상: <span className="font-semibold text-foreground">{count}개</span>
                            </p>
                          </div>
                          <Badge variant="destructive" className="shrink-0">
                            {count}
                          </Badge>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              )}

              {notificationCount > 0 && (
                <div className="p-3 border-t bg-muted/30">
                  <Button
                    size="sm"
                    variant="default"
                    className="w-full"
                    onClick={() => handleMarkAsRead()}
                  >
                    모두 읽음으로 표시
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
