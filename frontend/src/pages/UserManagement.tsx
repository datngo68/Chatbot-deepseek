import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from 'react-query'
import { UserPlus, Edit, Trash2, Shield, Search, Download } from 'lucide-react'
import { userAPI } from '@/services/api'
import { useAuthStore } from '@/stores/authStore'
import toast from 'react-hot-toast'
import { formatRelativeTime } from '@/lib/utils'

interface User {
  id: string
  username: string
  email: string
  role: 'admin' | 'user'
  status: 'active' | 'inactive' | 'banned'
  createdAt: string
  lastLogin?: string
  loginCount: number
}

export default function UserManagement() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedRole, setSelectedRole] = useState<string>('all')
  const [selectedStatus, setSelectedStatus] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  // const [editingUser] = useState<User | null>(null)
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
    password: '',
    role: 'user' as 'admin' | 'user'
  })

  const { user: currentUser } = useAuthStore()
  const queryClient = useQueryClient()

  // Check if current user is admin
  const isAdmin = currentUser?.role === 'admin'

  const { data: usersData, isLoading } = useQuery(
    ['users', searchQuery, selectedRole, selectedStatus],
    () => userAPI.getUsers({
      search: searchQuery,
      role: selectedRole === 'all' ? undefined : selectedRole,
      status: selectedStatus === 'all' ? undefined : selectedStatus
    }),
    {
      enabled: isAdmin,
      refetchOnWindowFocus: false,
    }
  )

  const users = usersData?.data || []

  const updateUserMutation = useMutation(
    (data: { userId: string; updates: Partial<User> }) => 
      userAPI.updateUser(data.userId, data.updates),
    {
             onSuccess: () => {
         queryClient.invalidateQueries(['users'])
         toast.success('Cập nhật người dùng thành công!')
       },
      onError: () => {
        toast.error('Cập nhật người dùng thất bại')
      }
    }
  )

  const deleteUserMutation = useMutation(
    (userId: string) => userAPI.deleteUser(userId),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('Xóa người dùng thành công!')
      },
      onError: () => {
        toast.error('Xóa người dùng thất bại')
      }
    }
  )

  const createUserMutation = useMutation(
    (userData: typeof newUser) => userAPI.createUser(userData),
    {
      onSuccess: () => {
        queryClient.invalidateQueries(['users'])
        toast.success('Tạo người dùng thành công!')
        setShowAddModal(false)
        setNewUser({ username: '', email: '', password: '', role: 'user' })
      },
      onError: () => {
        toast.error('Tạo người dùng thất bại')
      }
    }
  )

  const handleStatusChange = (userId: string, status: User['status']) => {
    updateUserMutation.mutate({ userId, updates: { status } })
  }

  const handleRoleChange = (userId: string, role: User['role']) => {
    updateUserMutation.mutate({ userId, updates: { role } })
  }

  const handleDeleteUser = (userId: string) => {
    if (confirm('Bạn có chắc muốn xóa người dùng này?')) {
      deleteUserMutation.mutate(userId)
    }
  }

  const handleCreateUser = () => {
    if (!newUser.username || !newUser.email || !newUser.password) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }
    createUserMutation.mutate(newUser)
  }

  const exportUsers = async () => {
    try {
      const blob = await userAPI.exportUsers()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `users-${new Date().toISOString().split('T')[0]}.csv`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      toast.success('Xuất danh sách người dùng thành công!')
    } catch (error) {
      toast.error('Xuất danh sách thất bại')
    }
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Shield className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-white">
            Không có quyền truy cập
          </h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Chỉ admin mới có thể truy cập trang này.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Quản lý người dùng
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Quản lý tài khoản và quyền hạn người dùng
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={exportUsers}
            className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600 dark:hover:bg-gray-600"
          >
            <Download size={16} className="mr-2" />
            Xuất CSV
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            <UserPlus size={16} className="mr-2" />
            Thêm người dùng
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Tìm kiếm người dùng..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
          />
        </div>
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Tất cả vai trò</option>
          <option value="admin">Admin</option>
          <option value="user">User</option>
        </select>
        <select
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
        >
          <option value="all">Tất cả trạng thái</option>
          <option value="active">Hoạt động</option>
          <option value="inactive">Không hoạt động</option>
          <option value="banned">Bị cấm</option>
        </select>
      </div>

      {/* Users table */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Người dùng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Vai trò
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Hoạt động
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            {isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Đang tải...
                </td>
              </tr>
            ) : users.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                  Không tìm thấy người dùng nào
                </td>
              </tr>
            ) : (
              users.map((user: User) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {user.username}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {user.email}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value as User['role'])}
                      className="text-sm border rounded px-2 py-1 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                      disabled={user.id === currentUser?.id}
                    >
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <select
                      value={user.status}
                      onChange={(e) => handleStatusChange(user.id, e.target.value as User['status'])}
                      className={`text-xs font-medium px-2 py-1 rounded-full border ${
                        user.status === 'active' ? 'bg-green-100 text-green-800 border-green-200' :
                        user.status === 'inactive' ? 'bg-yellow-100 text-yellow-800 border-yellow-200' :
                        'bg-red-100 text-red-800 border-red-200'
                      }`}
                      disabled={user.id === currentUser?.id}
                    >
                      <option value="active">Hoạt động</option>
                      <option value="inactive">Không hoạt động</option>
                      <option value="banned">Bị cấm</option>
                    </select>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                    <div>
                      <div>Tham gia: {formatRelativeTime(user.createdAt)}</div>
                      {user.lastLogin && (
                        <div>Đăng nhập: {formatRelativeTime(user.lastLogin)}</div>
                      )}
                      <div>Số lần đăng nhập: {user.loginCount}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                                           <button
                       onClick={() => console.log('Edit user:', user)}
                       className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-300"
                     >
                       <Edit size={16} />
                     </button>
                      {user.id !== currentUser?.id && (
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
              Thêm người dùng mới
            </h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên người dùng"
                value={newUser.username}
                onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="email"
                placeholder="Email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <input
                type="password"
                placeholder="Mật khẩu"
                value={newUser.password}
                onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
              <select
                value={newUser.role}
                onChange={(e) => setNewUser({ ...newUser, role: e.target.value as 'admin' | 'user' })}
                className="w-full p-3 border border-gray-300 rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                Hủy
              </button>
              <button
                onClick={handleCreateUser}
                disabled={createUserMutation.isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {createUserMutation.isLoading ? 'Đang tạo...' : 'Tạo'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}