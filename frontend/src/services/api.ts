import axios from 'axios'
import { useAuthStore } from '@/stores/authStore'
import { Message, ChatSession, User, ApiResponse } from '../../../shared/types'

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

  forgotPassword: async (email: string) => {
    const response = await api.post<ApiResponse>('/auth/forgot-password', { email })
    return response.data
  },

  resetPassword: async (token: string, password: string) => {
    const response = await api.post<ApiResponse>('/auth/reset-password', { token, password })
    return response.data
  },

  verifyResetToken: async (token: string) => {
    const response = await api.get<ApiResponse>(`/auth/verify-reset-token/${token}`)
    return response.data
  },
}

// Chat API
export const chatAPI = {
  sendMessage: async (message: string, sessionId?: string, stream = false) => {
    const response = await api.post<ApiResponse<{
      message: string
      sessionId: string
      usage: {
        prompt_tokens?: number
        completion_tokens?: number
        total_tokens?: number
      }
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

// User Management API
export const userAPI = {
  getUsers: async (params?: { search?: string; role?: string; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.role) searchParams.append('role', params.role)
    if (params?.status) searchParams.append('status', params.status)
    
    const response = await api.get<ApiResponse<any[]>>(`/admin/users?${searchParams.toString()}`)
    return response.data
  },
  
  createUser: async (userData: { username: string; email: string; password: string; role: string }) => {
    const response = await api.post<ApiResponse<User>>('/admin/users', userData)
    return response.data
  },
  
  updateUser: async (userId: string, updates: any) => {
    const response = await api.put<ApiResponse<User>>(`/admin/users/${userId}`, updates)
    return response.data
  },
  
  deleteUser: async (userId: string) => {
    const response = await api.delete<ApiResponse>(`/admin/users/${userId}`)
    return response.data
  },
  
  exportUsers: async (): Promise<Blob> => {
    const response = await api.get('/admin/users/export', {
      responseType: 'blob'
    })
    return response.data
  }
}

// Knowledge Base API
export const knowledgeAPI = {
  getDocuments: async (params?: { search?: string; status?: string }) => {
    const searchParams = new URLSearchParams()
    if (params?.search) searchParams.append('search', params.search)
    if (params?.status) searchParams.append('status', params.status)
    
    const response = await api.get<ApiResponse<any[]>>(`/knowledge/documents?${searchParams.toString()}`)
    return response.data
  },
  
  uploadDocuments: async (files: File[], onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    files.forEach(file => formData.append('documents', file))
    
    const response = await api.post<ApiResponse<any>>('/knowledge/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          onProgress(progress)
        }
      }
    })
    return response.data
  },
  
  deleteDocument: async (documentId: string) => {
    const response = await api.delete<ApiResponse>(`/knowledge/documents/${documentId}`)
    return response.data
  },
  
  processDocument: async (documentId: string) => {
    const response = await api.post<ApiResponse>(`/knowledge/documents/${documentId}/process`)
    return response.data
  },
  
  downloadDocument: async (documentId: string) => {
    const response = await api.get(`/knowledge/documents/${documentId}/download`, {
      responseType: 'blob'
    })
    const url = window.URL.createObjectURL(response.data)
    const a = document.createElement('a')
    a.href = url
    a.download = 'document'
    document.body.appendChild(a)
    a.click()
    window.URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }
}

export default api
