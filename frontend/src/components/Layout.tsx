import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { 
  MessageSquare, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Monitor,
  Users,
  BookOpen
} from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { useTheme } from '@/hooks/useTheme'
import { cn } from '@/lib/utils'
import SessionList from './SessionList'

interface LayoutProps {
  children: React.ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { logout, user } = useAuthStore()
  const { theme, setTheme } = useTheme()

  const handleLogout = () => {
    logout()
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Mobile sidebar */}
      <div className={cn(
        "fixed inset-0 z-50 lg:hidden",
        sidebarOpen ? "block" : "hidden"
      )}>
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
        <div className="fixed inset-y-0 left-0 flex w-64 flex-col bg-white dark:bg-gray-800">
          <div className="flex h-16 items-center justify-between px-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              DeepSeek Chat
            </h1>
            <button
              onClick={() => setSidebarOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={24} />
            </button>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col">
        <div className="flex flex-col flex-grow bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center px-4">
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
              DeepSeek Chat
            </h1>
          </div>
          <SidebarContent />
        </div>
      </div>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top bar */}
        <div className="flex h-16 items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Menu size={24} />
          </button>

          <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setTheme('light')}
                className={cn(
                  "p-2 rounded-md",
                  theme === 'light' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" 
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Sun size={20} />
              </button>
              <button
                onClick={() => setTheme('dark')}
                className={cn(
                  "p-2 rounded-md",
                  theme === 'dark' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" 
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Moon size={20} />
              </button>
              <button
                onClick={() => setTheme('system')}
                className={cn(
                  "p-2 rounded-md",
                  theme === 'system' 
                    ? "bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-400" 
                    : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                )}
              >
                <Monitor size={20} />
              </button>
            </div>

            {/* User menu */}
            <div className="flex items-center space-x-3">
              <div className="text-sm">
                <p className="font-medium text-gray-900 dark:text-white">
                  {user?.username}
                </p>
                <p className="text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                title="Đăng xuất"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  )
}

function SidebarContent() {
  const location = useLocation()
  const { user } = useAuthStore()

  const navigation = [
    { name: 'Chat', href: '/chat', icon: MessageSquare },
    { name: 'Kho kiến thức', href: '/knowledge', icon: BookOpen },
    { name: 'Cài đặt', href: '/settings', icon: Settings },
  ]

  const adminNavigation = [
    { name: 'Quản lý người dùng', href: '/users', icon: Users },
  ]

  return (
    <>
      {/* Navigation */}
      <nav className="flex-1 space-y-1 px-2 py-4">
        {navigation.map((item) => (
          <Link
            key={item.name}
            to={item.href}
            className={cn(
              "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
              location.pathname === item.href
                ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
            )}
          >
            <item.icon size={20} className="mr-3" />
            {item.name}
          </Link>
        ))}

        {/* Admin navigation */}
        {user?.role === 'admin' && (
          <>
            <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
            <div className="px-2 py-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Quản trị
              </p>
            </div>
            {adminNavigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "group flex items-center px-2 py-2 text-sm font-medium rounded-md",
                  location.pathname === item.href
                    ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-700 dark:hover:text-white"
                )}
              >
                <item.icon size={20} className="mr-3" />
                {item.name}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto">
        <SessionList />
      </div>

      {/* User info */}
      <div className="border-t border-gray-200 dark:border-gray-700 p-4">
        <div className="flex items-center">
          <div className="flex-shrink-0">
            <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
              <span className="text-sm font-medium text-white">
                {user?.username?.charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {user?.username}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
