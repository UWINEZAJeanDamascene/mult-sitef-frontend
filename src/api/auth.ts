import { api } from './axios'
import type { 
  LoginCredentials, 
  AuthResponse, 
  User, 
  CreateUserData 
} from '@/types'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await api.post('/auth/login', credentials)
    return data
  },

  getMe: async (): Promise<User> => {
    const { data } = await api.get('/auth/me')
    return data
  },

  createUser: async (userData: CreateUserData): Promise<User> => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/auth/users')
    return data
  },

  deleteUser: async (id: string): Promise<void> => {
    await api.delete(`/auth/users/${id}`)
  },

  // Profile
  getProfile: async (): Promise<User> => {
    const { data } = await api.get('/auth/profile')
    return data
  },

  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const { data } = await api.patch('/auth/profile', profileData)
    return data
  },

  uploadProfilePicture: async (image: string): Promise<{ profilePicture: string }> => {
    const { data } = await api.post('/auth/profile/picture', { image })
    return data
  },
}
