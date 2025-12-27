'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { UserSettings } from '@short-tube/types'

// Get settings
export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: async () => {
      const response = await apiClient.get<UserSettings>('/settings')
      return response.data
    },
  })
}

// Update settings
export function useUpdateSettings() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (settings: Partial<UserSettings>) => {
      const response = await apiClient.patch<UserSettings>('/settings', settings)
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] })
    },
  })
}

// Test telegram notification
export function useTestTelegram() {
  return useMutation({
    mutationFn: async () => {
      const response = await apiClient.post('/settings/telegram/test')
      return response.data
    },
  })
}
