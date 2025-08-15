import { useState, useCallback } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { Upload, File, Trash2, Eye, Download, Search, BookOpen, Brain } from 'lucide-react'
import { useDropzone } from 'react-dropzone'
import { knowledgeAPI } from '@/services/api'
import toast from 'react-hot-toast'
import { formatRelativeTime, formatFileSize } from '@/lib/utils'

interface Document {
  id: string
  title: string
  filename: string
  fileSize: number
  mimeType: string
  uploadedAt: string
  processed: boolean
  status: 'processing' | 'ready' | 'error'
  chunkCount?: number
  tags: string[]
}

export default function KnowledgeBase() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const [previewDocument, setPreviewDocument] = useState<Document | null>(null)

  const queryClient = useQueryClient()

  const { data: documentsData, isLoading } = useQuery(
    ['knowledge-base', searchQuery, selectedStatus],
    () => knowledgeAPI.getDocuments({
      search: searchQuery,
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }),
    {
      refetchOnWindowFocus: false,
    }
  )

  const documents = documentsData?.data || []

  const uploadMutation = useMutation(
    (files: File[]) => knowledgeAPI.uploadDocuments(files, (progress) => {
      setUploadProgress(progress)
    }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['knowledge-base'])
        toast.success('Tải file thành công!')
        setShowUploadModal(false)
        setIsUploading(false)
        setUploadProgress(0)
      },
      onError: () => {
        toast.error('Tải file thất bại')
        setIsUploading(false)
        setUploadProgress(0)
      }
    }
  )

  const deleteMutation = useMutation(
    (documentId: string) => knowledgeAPI.deleteDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['knowledge-base'])
        toast.success('Xóa tài liệu thành công!')
      },
      onError: () => {
        toast.error('Xóa tài liệu thất bại')
      }
    }
  )

  const processDocumentMutation = useMutation(
    (documentId: string) => knowledgeAPI.processDocument(documentId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['knowledge-base'])
        toast.success('Xử lý tài liệu thành công!')
      },
      onError: () => {
        toast.error('Xử lý tài liệu thất bại')
      }
    }
  )

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setIsUploading(true)
      uploadMutation.mutate(acceptedFiles)
    }
  }, [uploadMutation])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/plain': ['.txt'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/markdown': ['.md']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
  })

  const handleDeleteDocument = (documentId: string) => {
    if (confirm('Bạn có chắc muốn xóa tài liệu này?')) {
      deleteMutation.mutate(documentId)
    }
  }

  const handleProcessDocument = (documentId: string) => {
    processDocumentMutation.mutate(documentId)
  }

  const getStatusBadge = (status: Document['status']) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded-full"
    switch (status) {
      case 'processing':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`
      case 'ready':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`
      case 'error':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`
    }
  }

  const getFileIcon = (mimeType: string) => {
    if (mimeType.includes('pdf')) return '📄'
    if (mimeType.includes('word') || mimeType.includes('doc')) return '📝'
    if (mimeType.includes('text')) return '📋'
    return '📄'
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
            <BookOpen className="mr-3" />
            Kho kiến thức
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý tài liệu để huấn luyện chatbot thông minh hơn
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          <Upload size={16} className="mr-2" />
          Tải lên tài liệu
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng tài liệu</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{documents.length}</p>
            </div>
            <File className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đã xử lý</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {documents.filter(doc => doc.status === 'ready').length}
              </p>
            </div>
            <Brain className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Đang xử lý</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {documents.filter(doc => doc.status === 'processing').length}
              </p>
            </div>
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-600"></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tổng chunks</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {documents.reduce((sum, doc) => sum + (doc.chunkCount || 0), 0)}
              </p>
            </div>
            <div className="text-purple-600 text-2xl">🧩</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="processing">Đang xử lý</option>
          <option value="ready">Đã xử lý</option>
          <option value="error">Lỗi</option>
        </select>
      </div>

      {/* Documents grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded mb-4"></div>
              <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          ))
        ) : documents.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <BookOpen className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
              Chưa có tài liệu
            </h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Bắt đầu bằng cách tải lên tài liệu đầu tiên.
            </p>
          </div>
        ) : (
          documents.map((document) => (
            <div
              key={document.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center">
                    <span className="text-2xl mr-2">{getFileIcon(document.mimeType)}</span>
                    <h3 className="text-sm font-medium text-gray-900 dark:text-white truncate">
                      {document.title}
                    </h3>
                  </div>
                  <span className={getStatusBadge(document.status)}>
                    {document.status === 'processing' ? 'Đang xử lý' :
                     document.status === 'ready' ? 'Sẵn sáng' : 'Lỗi'}
                  </span>
                </div>
                
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                  {document.filename}
                </p>
                
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  <div>Kích thước: {formatFileSize(document.fileSize)}</div>
                  <div>Tải lên: {formatRelativeTime(document.uploadedAt)}</div>
                  {document.chunkCount && (
                    <div>Chunks: {document.chunkCount}</div>
                  )}
                </div>

                {document.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {document.tags.map((tag: string, index: number) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex justify-between items-center">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setPreviewDocument(document)}
                      className="text-blue-600 hover:text-blue-800 dark:text-blue-400"
                      title="Xem trước"
                    >
                      <Eye size={16} />
                    </button>
                    {document.status === 'ready' && (
                      <button
                        onClick={() => knowledgeAPI.downloadDocument(document.id)}
                        className="text-green-600 hover:text-green-800 dark:text-green-400"
                        title="Tải xuống"
                      >
                        <Download size={16} />
                      </button>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    {document.status === 'error' && (
                      <button
                        onClick={() => handleProcessDocument(document.id)}
                        className="text-yellow-600 hover:text-yellow-800 dark:text-yellow-400"
                        title="Xử lý lại"
                      >
                        <Brain size={16} />
                      </button>
                    )}
                    <button
                      onClick={() => handleDeleteDocument(document.id)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400"
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-lg">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Tải lên tài liệu
            </h3>
            
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                {isDragActive
                  ? 'Thả file vào đây...'
                  : 'Kéo thả file vào đây hoặc click để chọn'}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-500">
                Hỗ trợ: PDF, DOC, DOCX, TXT, MD (tối đa 50MB)
              </p>
            </div>

            {isUploading && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                  <span>Đang tải lên...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 dark:bg-gray-700">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowUploadModal(false)}
                disabled={isUploading}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 disabled:opacity-50"
              >
                {isUploading ? 'Đang tải...' : 'Đóng'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDocument && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-4xl max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                {previewDocument.title}
              </h3>
              <button
                onClick={() => setPreviewDocument(null)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Thông tin file</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-400">
                  <div>Tên file: {previewDocument.filename}</div>
                  <div>Kích thước: {formatFileSize(previewDocument.fileSize)}</div>
                  <div>Loại file: {previewDocument.mimeType}</div>
                  <div>Trạng thái: {previewDocument.status}</div>
                  <div>Tải lên: {formatRelativeTime(previewDocument.uploadedAt)}</div>
                  {previewDocument.chunkCount && (
                    <div>Số chunks: {previewDocument.chunkCount}</div>
                  )}
                </div>
              </div>
              
              {previewDocument.tags.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Tags</h4>
                  <div className="flex flex-wrap gap-2">
                    {previewDocument.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 text-sm bg-blue-100 text-blue-800 rounded dark:bg-blue-900 dark:text-blue-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}