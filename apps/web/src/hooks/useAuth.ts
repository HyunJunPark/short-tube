import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/api-client'
import { useAuthStore } from '@/stores/authStore'
import { RegisterRequest, LoginRequest, AuthResponse, UserWithoutPassword } from '@short-tube/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

// API functions
const authApi = {
  register: async (data: RegisterRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data)
    return response.data
  },

  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', data)
    return response.data
  },

  getCurrentUser: async (): Promise<UserWithoutPassword> => {
    const response = await apiClient.get<UserWithoutPassword>('/auth/me')
    return response.data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout')
  },
}

export function useAuth() {
  const { user, isAuthenticated, isLoading, setAuth, clearAuth, setLoading } = useAuthStore()
  const queryClient = useQueryClient()
  const router = useRouter()

  // Fetch current user on mount if token exists
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: authApi.getCurrentUser,
    enabled: !!useAuthStore.getState().token && !user,
    retry: false,
    staleTime: Infinity,
  })

  // Update auth state when current user is fetched
  useEffect(() => {
    if (currentUser) {
      const token = useAuthStore.getState().token
      if (token) {
        setAuth(currentUser, token)
      }
    } else if (!useAuthStore.getState().token) {
      setLoading(false)
    }
  }, [currentUser, setAuth, setLoading])

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      router.push('/')
    },
  })

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      queryClient.invalidateQueries({ queryKey: ['currentUser'] })
      router.push('/')
    },
  })

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      clearAuth()
      queryClient.clear()
      router.push('/login')
    },
    onError: () => {
      // Clear auth even if API call fails
      clearAuth()
      queryClient.clear()
      router.push('/login')
    },
  })

  return {
    user,
    isAuthenticated,
    isLoading,
    register: registerMutation.mutate,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isRegistering: registerMutation.isPending,
    isLoggingIn: loginMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
    registerError: registerMutation.error,
    loginError: loginMutation.error,
  }
}
