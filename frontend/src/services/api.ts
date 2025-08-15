import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { Message, ChatSession, User, ApiResponse } from '@/types'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = useAuthStore.getState().token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      useAuthStore.getState().logout()
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/login', {
      email,
      password,
    })
    return response.data
  },

  register: async (username: string, email: string, password: string) => {
    const response = await api.post<ApiResponse<{ token: string; user: User }>>('/auth/register', {
      username,
      email,
      password,
    })
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get<ApiResponse<{ user: User }>>('/auth/me')
    return response.data
  },
}

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, sessionId?: string, stream = false) => {
    const response = await api.post<ApiResponse<{
      message: string
      sessionId: string
      usage: any
    }>>('/chat/send', {
      message,
      sessionId,
      stream,
    })
    return response.data
  },

  getMessages: async (sessionId: string) => {
    const response = await api.get<ApiResponse<Message[]>>(`/chat/messages/${sessionId}`)
    return response.data
  },

  deleteMessage: async (messageId: string) => {
    const response = await api.delete<ApiResponse>(`/chat/messages/${messageId}`)
    return response.data
  },
}

// Sessions API
export const sessionsAPI = {
  getSessions: async () => {
    const response = await api.get<ApiResponse<ChatSession[]>>('/sessions')
    return response.data
  },

  getSession: async (sessionId: string) => {
    const response = await api.get<ApiResponse<ChatSession>>(`/sessions/${sessionId}`)
    return response.data
  },

  createSession: async (title: string) => {
    const response = await api.post<ApiResponse<ChatSession>>('/sessions', { title })
    return response.data
  },

  updateSession: async (sessionId: string, title: string) => {
    const response = await api.put<ApiResponse<ChatSession>>(`/sessions/${sessionId}`, { title })
    return response.data
  },

  deleteSession: async (sessionId: string) => {
    const response = await api.delete<ApiResponse>(`/sessions/${sessionId}`)
    return response.data
  },

  exportSession: async (sessionId: string) => {
    const response = await api.get(`/sessions/${sessionId}/export`, {
      responseType: 'blob',
    })
    return response.data
  },

  searchSessions: async (query: string) => {
    const response = await api.get<ApiResponse<ChatSession[]>>(`/sessions/search/${query}`)
    return response.data
  },
}

export default api
