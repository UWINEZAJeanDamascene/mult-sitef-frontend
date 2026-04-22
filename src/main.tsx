import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter } from 'react-router-dom'
import { Toaster, toast } from 'react-hot-toast'
import { ThemeProvider } from './context/ThemeContext'
import { ErrorBoundary } from './components/ErrorBoundary'
import App from './App'
import './index.css'

// Global error handler for React Query
class QueryErrorHandler {
  private logout: (() => void) | null = null

  setLogoutFn(logout: () => void) {
    this.logout = logout
  }

  handleError(error: any) {
    // Handle 401 Unauthorized - trigger logout
    if (error?.response?.status === 401 || error?.status === 401) {
      this.logout?.()
      return
    }

    // Handle network errors
    if (error?.message?.includes('Network Error') || !navigator.onLine) {
      toast.error('Network error. Please check your connection.')
      return
    }

    // Generic error toast for mutations
    const message = error?.response?.data?.error || error?.message || 'An error occurred'
    toast.error(message)
  }
}

export const queryErrorHandler = new QueryErrorHandler()

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
    mutations: {
      onError: (error) => {
        queryErrorHandler.handleError(error)
      },
      onSuccess: () => {
        toast.success('Operation completed successfully')
      },
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
          <Toaster position="top-right" />
        </BrowserRouter>
      </QueryClientProvider>
    </ThemeProvider>
  </ErrorBoundary>,
)
