// @ts-nocheck
import { useState, useEffect } from 'react'
import { useQuery } from 'react-query'
import { Plus, Search, Trash2, Download } from 'lucide-react'
import { sessionsAPI } from '@/services/api'
import { useChatStore } from '@/stores/chatStore'
import { formatRelativeTime, truncateText } from '@/lib/utils'
import toast from 'react-hot-toast'

export default function SessionList() {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [newSessionTitle, setNewSessionTitle] = useState('')
  
  const { currentSession, setCurrentSession, setMessages } = useChatStore()

  const { data: sessionsData, refetch } = useQuery(
    ['sessions', searchQuery],
    () => searchQuery ? sessionsAPI.searchSessions(searchQuery) : sessionsAPI.getSessions(),
    {
      refetchOnWindowFocus: false,
    }
  )

  const sessions = sessionsData?.data || []

  const handleCreateSession = async () => {
    if (!newSessionTitle.trim()) return

    try {
      const response = await sessionsAPI.createSession(newSessionTitle)
      if (response.success) {
        setShowNewSessionModal(false)
        setNewSessionTitle('')
        refetch()
        toast.success('Tạo phiên chat mới thành công!')
      }
    } catch (error) {
      console.error('Create session error:', error)
      toast.error('Tạo phiên chat thất bại')
    }
  }

  const handleSelectSession = async (sessionId: string) => {
    try {
      const messagesResponse = await sessionsAPI.getSession(sessionId)
      if (messagesResponse.success) {
        setCurrentSession(messagesResponse.data)
        
        // Load messages for this session
        const messagesResponse2 = await sessionsAPI.getSession(sessionId)
        if (messagesResponse2.success) {
          // You might need to adjust this based on your API response structure
          setMessages([]) // Clear current messages and load session messages
        }
      }
    } catch (error) {
      console.error('Load session error:', error)
      toast.error('Tải phiên chat thất bại')
    }
  }

  const handleDeleteSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    if (!confirm('Bạn có chắc muốn xóa phiên chat này?')) return

    try {
      await sessionsAPI.deleteSession(sessionId)
      refetch()
      toast.success('Xóa phiên chat thành công!')
      
      // Clear current session if it was deleted
      if (currentSession?.id === sessionId) {
        setCurrentSession(null)
        setMessages([])
      }
    } catch (error) {
      console.error('Delete session error:', error)
      toast.error('Xóa phiên chat thất bại')
    }
  }

  const handleExportSession = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    
    try {
      const blob = await sessionsAPI.exportSession(sessionId)
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `chat-${sessionId}.json`
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

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">
            Phiên chat
          </h3>
          <button
            onClick={() => setShowNewSessionModal(true)}
            className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            title="Tạo phiên chat mới"
          >
            <Plus size={16} />
          </button>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm phiên chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
        </div>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="p-4 text-center text-gray-500 dark:text-gray-400">
            <p className="text-sm">
              {searchQuery ? 'Không tìm thấy phiên chat nào' : 'Chưa có phiên chat nào'}
            </p>
          </div>
        ) : (
          <div className="space-y-1 p-2">
            {sessions.map((session) => (
              <div
                key={session.id}
                onClick={() => handleSelectSession(session.id)}
                className={`group flex items-center justify-between p-3 rounded-lg cursor-pointer transition-colors ${
                  currentSession?.id === session.id
                    ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-medium truncate">
                    {truncateText(session.title, 30)}
                  </h4>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {formatRelativeTime(session.updatedAt)}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {session.messageCount} tin nhắn
                  </p>
                </div>
                
                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleExportSession(session.id, e)}
                    className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    title="Xuất chat"
                  >
                    <Download size={14} />
                  </button>
                  <button
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400"
                    title="Xóa phiên chat"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New session modal */}
      {showNewSessionModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-96">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tạo phiên chat mới
            </h3>
            <input
              type="text"
              placeholder="Nhập tên phiên chat..."
              value={newSessionTitle}
              onChange={(e) => setNewSessionTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && handleCreateSession()}
            />
            <div className="flex justify-end space-x-3 mt-4">
              <button
                onClick={() => setShowNewSessionModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateSession}
                disabled={!newSessionTitle.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Tạo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
