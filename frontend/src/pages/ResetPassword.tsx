import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react'
import { authAPI } from '@/services/api'
import toast from 'react-hot-toast'

export default function ResetPassword() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenValid, setTokenValid] = useState<boolean | null>(null)
  const [passwordReset, setPasswordReset] = useState(false)

  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  useEffect(() => {
    const verifyToken = async () => {
      if (!token) {
        setTokenValid(false)
        return
      }

      try {
        const response = await authAPI.verifyResetToken(token)
        setTokenValid(response.success)
      } catch (error) {
        console.error('Token verification error:', error)
        setTokenValid(false)
      }
    }

    verifyToken()
  }, [token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!password || !confirmPassword) {
      toast.error('Vui lòng điền đầy đủ thông tin')
      return
    }

    if (password.length < 6) {
      toast.error('Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (password !== confirmPassword) {
      toast.error('Mật khẩu xác nhận không khớp')
      return
    }

    setIsLoading(true)
    try {
      const response = await authAPI.resetPassword(token!, password)
      
      if (response.success) {
        setPasswordReset(true)
        toast.success('Đặt lại mật khẩu thành công!')
        setTimeout(() => {
          navigate('/login')
        }, 3000)
      } else {
        toast.error(response.error || 'Đặt lại mật khẩu thất bại')
      }
    } catch (error: unknown) {
      console.error('Reset password error:', error)
      toast.error('Có lỗi xảy ra, vui lòng thử lại')
    } finally {
      setIsLoading(false)
    }
  }

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Đang xác thực liên kết...</p>
        </div>
      </div>
    )
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <div className="mx-auto h-16 w-16 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center">
              <Lock className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Liên kết không hợp lệ
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Liên kết đặt lại mật khẩu đã hết hạn hoặc không hợp lệ.
            </p>
          </div>
          
          <div className="text-center">
            <Link
              to="/forgot-password"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Gửi lại email khôi phục mật khẩu
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (passwordReset) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500" />
            <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
              Đặt lại mật khẩu thành công
            </h2>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              Mật khẩu của bạn đã được cập nhật thành công.
            </p>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Bạn sẽ được chuyển hướng đến trang đăng nhập trong vài giây...
            </p>
          </div>
          
          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Đăng nhập ngay
            </Link>
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
            <Lock className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Đặt lại mật khẩu
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Nhập mật khẩu mới cho tài khoản của bạn
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label htmlFor="password" className="sr-only">
                Mật khẩu mới
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Mật khẩu mới"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="sr-only">
                Xác nhận mật khẩu
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="appearance-none rounded-md relative block w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 placeholder-gray-500 dark:placeholder-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                  placeholder="Xác nhận mật khẩu mới"
                  minLength={6}
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-5 w-5 text-gray-400" />
                  ) : (
                    <Eye className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Password requirements */}
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <p className="mb-2">Mật khẩu phải:</p>
            <ul className="list-disc list-inside space-y-1">
              <li className={password.length >= 6 ? 'text-green-600 dark:text-green-400' : ''}>
                Có ít nhất 6 ký tự
              </li>
              <li className={password === confirmPassword && password ? 'text-green-600 dark:text-green-400' : ''}>
                Khớp với mật khẩu xác nhận
              </li>
            </ul>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading || password !== confirmPassword || password.length < 6}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-blue-500 dark:hover:bg-blue-600"
            >
              {isLoading ? 'Đang đặt lại...' : 'Đặt lại mật khẩu'}
            </button>
          </div>

          <div className="text-center">
            <Link
              to="/login"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Quay lại đăng nhập
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}