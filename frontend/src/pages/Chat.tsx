import { useState, useRef, useEffect } from 'react'
import { Send, Loader2, Plus, Download, Trash2 } from 'lucide-react'
import { useChatStore } from '@/stores/chatStore'
import { chatAPI, sessionsAPI } from '@/services/api'
import { Message } from '../../../shared/types'
import { formatRelativeTime, generateId } from '@/lib/utils'
import toast from 'react-hot-toast'
import MessageComponent from '@/components/MessageComponent'
// import SessionList from '@/components/SessionList'

export default function Chat() {
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessage, setStreamingMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  const {
    messages,
    currentSession,
    addMessage,
    setCurrentSession,
    clearChat
  } = useChatStore()

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage: Message = {
      id: generateId(),
      content: inputMessage,
      role: 'user',
      timestamp: new Date(),
      sessionId: currentSession?.id || ''
    }

    addMessage(userMessage)
    setInputMessage('')
    setIsLoading(true)

    try {
      const response = await chatAPI.sendMessage(
        inputMessage,
        currentSession?.id,
        false
      )

      if (response.success && response.data) {
        const assistantMessage: Message = {
          id: generateId(),
          content: response.data.message,
          role: 'assistant',
          timestamp: new Date(),
          sessionId: response.data.sessionId
        }

        addMessage(assistantMessage)

        // Update current session if it's a new session
        if (!currentSession) {
          const sessionResponse = await sessionsAPI.getSession(response.data.sessionId)
          if (sessionResponse.success) {
            setCurrentSession(sessionResponse.data || null)
          }
        }
      } else {
        toast.error(response.error || 'Gửi tin nhắn thất bại')
      }
    } catch (error: unknown) {
      console.error('Send message error:', error)
      const errorMessage = error instanceof Error && 'response' in error && typeof error.response === 'object' && error.response !== null && 'data' in error.response && typeof error.response.data === 'object' && error.response.data !== null && 'error' in error.response.data && typeof error.response.data.error === 'string' ? error.response.data.error : 'Gửi tin nhắn thất bại'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleNewChat = () => {
    clearChat()
    setCurrentSession(null)
  }

  const handleExportChat = async () => {
    if (!currentSession) {
      toast.error('Không có phiên chat để xuất')
      return
    }

    try {
      const blob = await sessionsAPI.exportSession(currentSession.id)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${currentSession.title}.json`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Xuất chat thành công!')
    } catch (error) {
      console.error('Export error:', error)
      toast.error('Xuất chat thất bại')
    }
  }

  const handleDeleteSession = async () => {
    if (!currentSession) return

    if (!confirm('Bạn có chắc muốn xóa phiên chat này?')) return

    try {
      await sessionsAPI.deleteSession(currentSession.id)
      clearChat()
      toast.success('Xóa phiên chat thành công!')
    } catch (error) {
      console.error('Delete session error:', error)
      toast.error('Xóa phiên chat thất bại')
    }
  }

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
            {currentSession?.title || 'Chat mới'}
          </h1>
          {currentSession && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {formatRelativeTime(currentSession.updatedAt)}
            </span>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleNewChat}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Chat mới"
          >
            <Plus size={20} />
          </button>
          
          {currentSession && (
            <>
              <button
                onClick={handleExportChat}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Xuất chat"
              >
                <Download size={20} />
              </button>
              <button
                onClick={handleDeleteSession}
                className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                title="Xóa phiên chat"
              >
                <Trash2 size={20} />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Chào mừng đến với DeepSeek Chat
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md">
              Bắt đầu cuộc trò chuyện với AI thông minh. Hãy đặt câu hỏi hoặc chia sẻ ý tưởng của bạn.
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageComponent key={msg.id} message={msg} />
          ))
        )}
        
        {/* Hiển thị streaming message */}
        {isStreaming && streamingMessage && (
          <div className="flex justify-start mb-4">
            <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-3 max-w-[80%]">
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                Assistant đang trả lời...
              </div>
              <div className="text-gray-900 dark:text-gray-100">
                {streamingMessage}
                <span className="animate-pulse">|</span>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex space-x-4">
          <div className="flex-1">
            <textarea
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Nhập tin nhắn của bạn..."
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:focus:ring-blue-400"
              rows={1}
              disabled={isLoading}
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>
      </div>
    </div>
  )
}
