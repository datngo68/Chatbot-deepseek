import { create } from 'zustand'
import { Message, ChatSession } from '../../../shared/types'

interface ChatState {
  sessions: ChatSession[]
  currentSession: ChatSession | null
  messages: Message[]
  isLoading: boolean
  error: string | null
  
  // Actions
  setSessions: (sessions: ChatSession[]) => void
  setCurrentSession: (session: ChatSession | null) => void
  setMessages: (messages: Message[]) => void
  addMessage: (message: Message) => void
  updateMessage: (id: string, content: string) => void
  removeMessage: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  clearChat: () => void
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSession: null,
  messages: [],
  isLoading: false,
  error: null,
  
  setSessions: (sessions) => set({ sessions }),
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  setMessages: (messages) => set({ messages }),
  
  addMessage: (message) => {
    const { messages } = get()
    set({ messages: [...messages, message] })
  },
  
  updateMessage: (id, content) => {
    const { messages } = get()
    set({
      messages: messages.map(msg => 
        msg.id === id ? { ...msg, content } : msg
      )
    })
  },
  
  removeMessage: (id) => {
    const { messages } = get()
    set({
      messages: messages.filter(msg => msg.id !== id)
    })
  },
  
  setLoading: (loading) => set({ isLoading: loading }),
  
  setError: (error) => set({ error }),
  
  clearError: () => set({ error: null }),
  
  clearChat: () => set({ 
    messages: [], 
    currentSession: null,
    error: null 
  }),
}))
