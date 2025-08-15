import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      toast.error('Vui lòng nhập email')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.forgotPassword(email)
      
      if (response.success) {
        setEmailSent(true)
        toast.success('Email khôi phục mật khẩu đã được gửi!')
      } else {
        toast.error(response.error || 'Gửi email thất bại')
      }
    } catch (error: unknown) {
      console.error('Forgot password error:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  if (emailSent) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Email đã được gửi
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Chúng tôi đã gửi liên kết khôi phục mật khẩu đến email của bạn.
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Vui lòng kiểm tra hộp thư của bạn và làm theo hướng dẫn để đặt lại mật khẩu.
            </p>
          </div>
          
          <div className="space-y-4">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Không nhận được email?{' '}
                <button
                  onClick={() => setEmailSent(false)}
                  className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                >
                  Gửi lại
                </button>
              </p>
            </div>
            
            <div className="text-center">
              <Link
                to="/login"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
              >
                <ArrowLeft size={16} className="mr-2" />
                Quay lại đăng nhập
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Quên mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Nhập email của bạn để nhận liên kết khôi phục mật khẩu
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="email" className="sr-only">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
              placeholder="Địa chỉ email"
            />
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? 'Đang gửi...' : 'Gửi email khôi phục'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              <ArrowLeft size={16} className="mr-2" />
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}