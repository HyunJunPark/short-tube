'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Summary } from '@short-tube/types'

// Get all summaries
export function useSummaries(filters?: { 
  tags?: string[]
  dateFrom?: string
  dateTo?: string
  year?: number
  month?: number
  day?: number
}) {
  return useQuery({
    queryKey: ['summaries', filters],
    queryFn: async () => {
      const response = await apiClient.get<Summary[]>('/summaries', {
        params: filters,
      })
      return response.data
    },
  })
}

// Get summary for a video
export function useSummary(videoId: string) {
  return useQuery({
    queryKey: ['summary', videoId],
    queryFn: async () => {
      const response = await apiClient.get<Summary>(`/summaries/${videoId}`)
      return response.data
    },
    enabled: !!videoId,
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}

// Generate summary
export function useGenerateSummary() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ videoId, tags }: { videoId: string; tags: string[] }) => {
      const response = await apiClient.post<Summary>('/summaries', {
        videoId,
        tags,
      })
      return response.data
    },
    onSuccess: (data) => {
      // Immediately update the cache with the new summary
      queryClient.setQueryData(['summary', data.video_id], data)
      
      // Invalidate all summaries queries for fresh data
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}

// Get summaries for a specific date
export function useBriefing(date: string) {
  return useQuery({
    queryKey: ['briefing', date],
    queryFn: async () => {
      const response = await apiClient.get<Summary[]>(`/summaries/date/${date}`)
      return response.data
    },
    enabled: !!date,
  })
}
