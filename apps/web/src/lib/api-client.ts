import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api'

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
})

// Request interceptor
apiClient.interceptors.request.use(
  (config) => {
    // You can add auth tokens here if needed
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    // Unwrap API response envelope if it has the expected structure
    // Expected format: { success: boolean, data: T }
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'success' in response.data) {
      // Return response object with unwrapped data, not raw data
      return {
        ...response,
        data: response.data.data,
      }
    }
    return response
  },
  (error) => {
    // Handle errors globally
    const message = error.response?.data?.message || error.message || 'Something went wrong'
    console.error('API Error:', message)
    return Promise.reject(new Error(message))
  }
)
