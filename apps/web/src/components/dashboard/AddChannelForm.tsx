'use client'

import { useState } from 'react'
import { Plus, Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAddSubscription, useUpdateSubscription, useDeleteSubscription } from '@/hooks/useSubscriptions'
import { CategorySelector } from './CategorySelector'
import { Subscription } from '@short-tube/types'

export function AddChannelForm() {
  const [step, setStep] = useState<'input' | 'confirm'>('input')
  const [channelInput, setChannelInput] = useState('')
  const [currentChannel, setCurrentChannel] = useState<Subscription | null>(null)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])

  const { mutate: addSubscription, isPending, isError, error } = useAddSubscription()
  const { mutate: updateSubscription, isPending: isUpdating } = useUpdateSubscription()
  const { mutate: deleteSubscription } = useDeleteSubscription()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelInput.trim()) return

    // Step 1: Backend registers channel + AI recommendation
    addSubscription(channelInput, {
      onSuccess: (data) => {
        setCurrentChannel(data)
        setSelectedCategories(data.categories || [])
        setStep('confirm')
      },
    })
  }

  const handleConfirmAdd = () => {
    if (!currentChannel) return

    // Update categories if modified
    if (JSON.stringify(selectedCategories) !== JSON.stringify(currentChannel.categories)) {
      updateSubscription(
        { ...currentChannel, categories: selectedCategories },
        {
          onSuccess: () => {
            resetForm()
          },
        }
      )
    } else {
      resetForm()
    }
  }

  const handleCancel = () => {
    // Delete channel on cancel
    if (currentChannel) {
      deleteSubscription(currentChannel.channel_id)
    }
    resetForm()
  }

  const resetForm = () => {
    setStep('input')
    setChannelInput('')
    setCurrentChannel(null)
    setSelectedCategories([])
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add YouTube Channel</CardTitle>
        <CardDescription>
          {step === 'input'
            ? 'Enter channel URL, handle (@username), or channel ID'
            : 'Review and adjust AI-recommended categories'}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {step === 'input' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="channel-input">Channel</Label>
              <div className="flex gap-2">
                <Input
                  id="channel-input"
                  placeholder="https://youtube.com/@channelname or @channelname"
                  value={channelInput}
                  onChange={(e) => setChannelInput(e.target.value)}
                  disabled={isPending}
                  className="flex-1"
                />
                <Button type="submit" disabled={isPending || !channelInput.trim()}>
                  {isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Plus className="mr-2 h-4 w-4" />
                      Add Channel
                    </>
                  )}
                </Button>
              </div>
              {isError && (
                <p className="text-sm text-destructive">
                  {error instanceof Error ? error.message : 'Failed to add channel'}
                </p>
              )}
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            {currentChannel && (
              <>
                <Alert>
                  <Sparkles className="h-4 w-4" />
                  <AlertDescription>
                    {(currentChannel.categories || []).length > 0
                      ? 'AI가 추천한 카테고리입니다. 수정 후 확인하세요.'
                      : '카테고리를 선택해주세요.'}
                  </AlertDescription>
                </Alert>

                <div className="p-3 bg-muted rounded-md">
                  <p className="text-sm font-medium">{currentChannel.channel_name}</p>
                  <p className="text-xs text-muted-foreground">
                    채널 ID: {currentChannel.channel_id}
                  </p>
                </div>

                <CategorySelector
                  selectedCategories={selectedCategories}
                  onChange={setSelectedCategories}
                />

                <div className="flex gap-2">
                  <Button onClick={handleConfirmAdd} disabled={isUpdating} className="flex-1">
                    {isUpdating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        저장 중...
                      </>
                    ) : (
                      '확인'
                    )}
                  </Button>
                  <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                    취소
                  </Button>
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
