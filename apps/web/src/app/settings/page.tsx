'use client'

import { useState, useEffect } from 'react'
import { Save, Send, Loader2, CheckCircle2 } from 'lucide-react'
import { MainLayout } from '@/components/layout/MainLayout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useSettings, useUpdateSettings, useTestTelegram } from '@/hooks/useSettings'

export default function SettingsPage() {
  const { data: settings, isLoading } = useSettings()
  const { mutate: updateSettings, isPending: isSaving } = useUpdateSettings()
  const { mutate: testTelegram, isPending: isTesting, isSuccess: testSuccess } = useTestTelegram()

  const [notificationTime, setNotificationTime] = useState('')
  const [telegramToken, setTelegramToken] = useState('')
  const [telegramChatId, setTelegramChatId] = useState('')

  // Load settings into form
  useEffect(() => {
    if (settings) {
      setNotificationTime(settings.notification_time || '')
      setTelegramToken(settings.telegram_token || '')
      setTelegramChatId(settings.telegram_chat_id || '')
    }
  }, [settings])

  const handleSave = () => {
    updateSettings({
      notification_time: notificationTime,
      telegram_token: telegramToken,
      telegram_chat_id: telegramChatId,
    })
  }

  const handleTest = () => {
    testTelegram()
  }

  if (isLoading) {
    return (
      <MainLayout title="Settings">
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout title="Settings">
      <div className="space-y-6 max-w-2xl">
        {/* Notification Schedule */}
        <Card>
          <CardHeader>
            <CardTitle>Notification Schedule</CardTitle>
            <CardDescription>
              Set the time for daily briefing notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notification-time">Daily Notification Time</Label>
              <Input
                id="notification-time"
                type="time"
                value={notificationTime}
                onChange={(e) => setNotificationTime(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                The system will check for new videos and send briefing at this time
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Telegram Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Telegram Notification</CardTitle>
            <CardDescription>
              Configure Telegram bot for receiving notifications
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="telegram-token">Bot Token</Label>
              <Input
                id="telegram-token"
                type="password"
                placeholder="1234567890:ABCdefGHIjklMNOpqrsTUVwxyz"
                value={telegramToken}
                onChange={(e) => setTelegramToken(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Get your bot token from @BotFather on Telegram
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telegram-chat-id">Chat ID</Label>
              <Input
                id="telegram-chat-id"
                placeholder="-1001234567890"
                value={telegramChatId}
                onChange={(e) => setTelegramChatId(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Your Telegram chat ID or group ID
              </p>
            </div>

            <Separator />

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleTest}
                disabled={isTesting || !telegramToken || !telegramChatId}
              >
                {isTesting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : testSuccess ? (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4 text-green-500" />
                    Test Sent
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Message
                  </>
                )}
              </Button>
              {testSuccess && (
                <p className="text-sm text-green-600 flex items-center">
                  Check your Telegram for the test message
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Save Button */}
        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={isSaving}
            size="lg"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Settings
              </>
            )}
          </Button>
        </div>
      </div>
    </MainLayout>
  )
}
