'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Video } from '@short-tube/types'

// Get videos for a channel
export function useVideos(channelId: string, enabled = true) {
  return useQuery({
    queryKey: ['videos', channelId],
    queryFn: async () => {
      const response = await apiClient.get<Video[]>(`/videos/channel/${channelId}`)
      return response.data
    },
    enabled: enabled && !!channelId,
  })
}

// Refresh videos for a channel
export function useRefreshVideos() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      const response = await apiClient.post<Video[]>(`/videos/refresh/${channelId}`)
      return response.data
    },
    onSuccess: (_, channelId) => {
      queryClient.invalidateQueries({ queryKey: ['videos', channelId] })
    },
  })
}
