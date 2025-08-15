// import { useState } from 'react'
import { useTheme } from '@/hooks/useTheme'
import { useAuthStore } from '@/stores/authStore'
import { Settings as SettingsIcon, User, Shield, Palette } from 'lucide-react'

export default function Settings() {
  const { theme, setTheme } = useTheme()
  const { user } = useAuthStore()

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Cài đặt
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Quản lý tài khoản và tùy chỉnh ứng dụng
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Settings */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <User className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Thông tin tài khoản
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Tên người dùng
                </label>
                <input
                  type="text"
                  value={user?.username || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Email
                </label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Ngày tham gia
                </label>
                <input
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : ''}
                  disabled
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white disabled:opacity-50"
                />
              </div>
            </div>
          </div>

          {/* Security Settings */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Shield className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Bảo mật
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Đổi mật khẩu
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                  Tính năng này sẽ được phát triển trong phiên bản tiếp theo.
                </p>
                <button
                  disabled
                  className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-md cursor-not-allowed"
                >
                  Đổi mật khẩu
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Appearance Settings */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <Palette className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Giao diện
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                  Chế độ giao diện
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="light"
                      checked={theme === 'light'}
                      onChange={(e) => setTheme(e.target.value as 'light')}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Sáng</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="dark"
                      checked={theme === 'dark'}
                      onChange={(e) => setTheme(e.target.value as 'dark')}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Tối</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="theme"
                      value="system"
                      checked={theme === 'system'}
                      onChange={(e) => setTheme(e.target.value as 'system')}
                      className="mr-3"
                    />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Theo hệ thống</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center">
                <SettingsIcon className="w-5 h-5 text-gray-500 dark:text-gray-400 mr-3" />
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Về ứng dụng
                </h2>
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Phiên bản
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">1.0.0</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Mô tả
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Ứng dụng chatbot thông minh được xây dựng với DeepSeek API, 
                  cung cấp trải nghiệm chat AI mượt mà và thân thiện với người dùng.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
