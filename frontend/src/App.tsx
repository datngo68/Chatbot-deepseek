import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { ThemeProvider } from '@/components/ThemeProvider'
import Layout from '@/components/Layout'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import Chat from '@/pages/Chat'
import Settings from '@/pages/Settings'
import UserManagement from '@/pages/UserManagement'
import ForgotPassword from '@/pages/ForgotPassword'
import ResetPassword from '@/pages/ResetPassword'
import KnowledgeBase from '@/pages/KnowledgeBase'

function App() {
  const { isAuthenticated } = useAuthStore()

  return (
    <ThemeProvider>
      <div className="min-h-screen bg-gray-50">
        <Routes>
          {/* Public routes */}
          <Route 
            path="/login" 
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <Login />} 
          />
          <Route 
            path="/register" 
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <Register />} 
          />
          <Route 
            path="/forgot-password" 
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <ForgotPassword />} 
          />
          <Route 
            path="/reset-password/:token" 
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <ResetPassword />} 
          />
          
          {/* Protected routes */}
          <Route 
            path="/" 
            element={isAuthenticated ? <Navigate to="/chat" replace /> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/chat" 
            element={isAuthenticated ? <Layout><Chat /></Layout> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/settings" 
            element={isAuthenticated ? <Layout><Settings /></Layout> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/users" 
            element={isAuthenticated ? <Layout><UserManagement /></Layout> : <Navigate to="/login" replace />} 
          />
          <Route 
            path="/knowledge" 
            element={isAuthenticated ? <Layout><KnowledgeBase /></Layout> : <Navigate to="/login" replace />} 
          />
          
          {/* Catch all */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </ThemeProvider>
  )
}

export default App
