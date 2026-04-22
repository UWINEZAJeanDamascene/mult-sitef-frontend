import { api } from './axios'
import { ActionLog, ActionLogStats, ActionLogsFilter } from '@/types/index'

export const actionLogsApi = {
  // Get all action logs
  getLogs: async (params: ActionLogsFilter): Promise<{
    logs: ActionLog[]
    total: number
    page: number
    totalPages: number
  }> => {
    const queryParams = new URLSearchParams()
    if (params.page) queryParams.append('page', params.page.toString())
    if (params.limit) queryParams.append('limit', params.limit.toString())
    if (params.action) queryParams.append('action', params.action)
    if (params.resource) queryParams.append('resource', params.resource)
    if (params.userId) queryParams.append('userId', params.userId)
    if (params.startDate) queryParams.append('startDate', params.startDate)
    if (params.endDate) queryParams.append('endDate', params.endDate)
    if (params.search) queryParams.append('search', params.search)

    const { data } = await api.get(`/action-logs?${queryParams.toString()}`)
    return data
  },

  // Get action log statistics
  getStats: async (): Promise<ActionLogStats> => {
    const { data } = await api.get('/action-logs/stats')
    return data
  },

  // Get single action log details
  getLog: async (id: string): Promise<ActionLog> => {
    const { data } = await api.get(`/action-logs/${id}`)
    return data
  },
}

export default actionLogsApi
