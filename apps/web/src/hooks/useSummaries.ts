'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Summary } from '@short-tube/types'

// Get all summaries
export function useSummaries(filters?: { tags?: string[]; dateFrom?: string; dateTo?: string }) {
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
    onSuccess: () => {
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
