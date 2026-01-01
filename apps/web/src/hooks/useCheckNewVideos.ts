'use client'

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface CheckNewVideosResponse {
  totalNewVideos: number
  byChannel: Record<string, number>
}

/**
 * Check for new videos across all active channels
 * Compares with existing cache and updates it automatically
 * Only call on main page load
 */
export function useCheckNewVideos(enabled = true) {
  const queryClient = useQueryClient()

  return useQuery({
    queryKey: ['videos', 'check-new'],
    queryFn: async () => {
      const response = await apiClient.post<CheckNewVideosResponse>(
        '/videos/check-new'
      )

      // Invalidate all video caches after checking new videos
      queryClient.invalidateQueries({ queryKey: ['videos'] })

      return response.data
    },
    enabled,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

/**
 * Mark notifications as checked for a specific channel
 */
export function useMarkNotificationsChecked() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      const response = await apiClient.post(`/videos/mark-checked/${channelId}`)
      return response.data
    },
    onSuccess: () => {
      // Invalidate check-new query to refresh notification counts
      queryClient.invalidateQueries({ queryKey: ['videos', 'check-new'] })
    },
  })
}
