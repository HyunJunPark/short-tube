'use client'

import { useState } from 'react'
import { Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAddSubscription } from '@/hooks/useSubscriptions'

export function AddChannelForm() {
  const [channelInput, setChannelInput] = useState('')
  const { mutate: addSubscription, isPending, isError, error } = useAddSubscription()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!channelInput.trim()) return

    addSubscription(channelInput, {
      onSuccess: () => {
        setChannelInput('')
      },
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add YouTube Channel</CardTitle>
        <CardDescription>
          Enter channel URL, handle (@username), or channel ID
        </CardDescription>
      </CardHeader>
      <CardContent>
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
      </CardContent>
    </Card>
  )
}
