import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useNavigate, Navigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Building2, Package, Loader2 } from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { ThemeToggle } from '@/components/ThemeToggle'

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  company_id: z.string().min(1, 'Company ID is required'),
})

type LoginFormData = z.infer<typeof loginSchema>

export function Login() {
  const { login, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      company_id: 'default-company',
    },
  })

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />
  }

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data)
      toast.success('Welcome back!')
      navigate('/dashboard')
    } catch (error: any) {
      const message = error.response?.data?.error || error.message || 'Login failed'
      toast.error(message)
      
      if (message.includes('email') || message.includes('user')) {
        setError('email', { message })
      } else if (message.includes('password')) {
        setError('password', { message })
      } else if (message.includes('company')) {
        setError('company_id', { message })
      } else {
        setError('root', { message })
      }
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary rounded-2xl mb-4 shadow-lg">
            <Package className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Lilstock</h1>
          <p className="text-muted-foreground mt-1">Multi-Site Stock Management</p>
        </div>

        {/* Login Card */}
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <h2 className="text-xl font-semibold text-card-foreground mb-6 text-center">
            Sign in to your account
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1.5">
                Email Address
              </label>
              <input
                {...register('email')}
                id="email"
                type="email"
                autoComplete="email"
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:ring-2 focus:ring-primary focus:border-primary
                  transition-all duration-200 bg-background text-foreground
                  ${errors.email ? 'border-destructive bg-destructive/10' : 'border-input'}
                `}
                placeholder="admin@lilstock.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-foreground mb-1.5">
                Password
              </label>
              <input
                {...register('password')}
                id="password"
                type="password"
                autoComplete="current-password"
                className={`
                  w-full px-4 py-2.5 rounded-lg border text-sm
                  focus:ring-2 focus:ring-primary focus:border-primary
                  transition-all duration-200 bg-background text-foreground
                  ${errors.password ? 'border-destructive bg-destructive/10' : 'border-input'}
                `}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            {/* Company ID Field */}
            <div>
              <label htmlFor="company_id" className="block text-sm font-medium text-foreground mb-1.5">
                Company ID
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  {...register('company_id')}
                  id="company_id"
                  type="text"
                  className={`
                    w-full pl-10 pr-4 py-2.5 rounded-lg border text-sm
                    focus:ring-2 focus:ring-primary focus:border-primary
                    transition-all duration-200 bg-background text-foreground
                    ${errors.company_id ? 'border-destructive bg-destructive/10' : 'border-input'}
                  `}
                  placeholder="default-company"
                />
              </div>
              {errors.company_id && (
                <p className="mt-1 text-sm text-destructive">{errors.company_id.message}</p>
              )}
            </div>

            {/* Root Error */}
            {errors.root && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-destructive">{errors.root.message}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="
                w-full flex items-center justify-center gap-2
                bg-primary hover:bg-primary/90 text-primary-foreground
                font-medium py-2.5 px-4 rounded-lg
                transition-all duration-200
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 p-4 rounded-lg bg-muted border border-border">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
              Demo Credentials
            </p>
            <div className="text-sm text-foreground space-y-1">
              <p><span className="font-medium">Name:</span> Main Manager</p>
              <p><span className="font-medium">Email:</span> admin@lilstock.com</p>
              <p><span className="font-medium">Password:</span> admin123</p>
              <p><span className="font-medium">Company:</span> default-company</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-sm text-muted-foreground mt-6">
          © {new Date().getFullYear()} Lilstock. All rights reserved.
        </p>
      </div>
    </div>
  )
}