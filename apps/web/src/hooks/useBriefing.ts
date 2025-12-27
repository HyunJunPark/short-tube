'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'

interface BriefingResponse {
  content: string
  title: string
  date: string
}

// Get briefing for a specific date
export function useBriefing(date: string) {
  return useQuery({
    queryKey: ['briefing', date],
    queryFn: async () => {
      const response = await apiClient.get<BriefingResponse>(`/briefing/${date}`)
      return response.data
    },
    enabled: !!date,
  })
}

// Generate briefing for a date
export function useGenerateBriefing() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (date: string) => {
      const response = await apiClient.post<BriefingResponse>('/briefing/generate', {
        date,
      })
      return response.data
    },
    onSuccess: (_, date) => {
      queryClient.invalidateQueries({ queryKey: ['briefing', date] })
      queryClient.invalidateQueries({ queryKey: ['summaries'] })
    },
  })
}
