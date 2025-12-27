'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import type { Subscription } from '@short-tube/types'

// Get all subscriptions
export function useSubscriptions() {
  return useQuery({
    queryKey: ['subscriptions'],
    queryFn: async () => {
      const response = await apiClient.get<Subscription[]>('/subscriptions')
      return response.data
    },
  })
}

// Add new subscription
export function useAddSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelInput: string) => {
      const response = await apiClient.post<Subscription>('/subscriptions', {
        channelInput,
      })
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

// Update subscription
export function useUpdateSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (subscription: Subscription) => {
      const response = await apiClient.patch<Subscription>(
        `/subscriptions/${subscription.channel_id}`,
        subscription
      )
      return response.data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}

// Delete subscription
export function useDeleteSubscription() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (channelId: string) => {
      await apiClient.delete(`/subscriptions/${channelId}`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['subscriptions'] })
    },
  })
}
