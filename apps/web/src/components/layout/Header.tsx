'use client'

import { Bell, Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useMarkNotificationsChecked } from '@/hooks/useCheckNewVideos'
import { useState } from 'react'

interface HeaderProps {
  title: string
  onMenuClick?: () => void
  notificationCount?: number
}

export function Header({ title, onMenuClick, notificationCount = 0 }: HeaderProps) {
  const { mutate: markChecked } = useMarkNotificationsChecked()
  const [hasNotifications, setHasNotifications] = useState(notificationCount > 0)

  const handleNotificationClick = () => {
    if (hasNotifications && notificationCount > 0) {
      // Mark all channels as checked
      // For now, we'll mark all visible channels as checked
      // In a real app, you might want to track which channels have notifications
      markChecked('*', {
        onSuccess: () => {
          setHasNotifications(false)
        },
      })
    }
  }

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

      <div className="flex items-center gap-4">
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
      </div>
    </header>
  )
}
