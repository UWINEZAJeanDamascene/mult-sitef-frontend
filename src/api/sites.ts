import { api } from './axios'
import type { Site, SiteRecord, Material } from '@/types'

export const sitesApi = {
  // Get sites for current user (scoped to assignedSites)
  getMySites: async (): Promise<Site[]> => {
    const { data } = await api.get('/sites')
    return data
  },

  // Get site by ID (checks access)
  getSite: async (id: string): Promise<Site> => {
    const { data } = await api.get(`/sites/${id}`)
    return data
  },
}

export const siteRecordsApi = {
  // Get records for specific site(s)
  getSiteRecords: async (siteId: string, params?: {
    startDate?: string
    endDate?: string
    materialName?: string
    page?: number
    limit?: number
  }): Promise<{ records: SiteRecord[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.materialName) queryParams.append('materialName', params.materialName)
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const { data } = await api.get(`/site-records?siteId=${siteId}&${queryParams.toString()}`)
    return data
  },

  // Get records for all assigned sites
  getMySiteRecords: async (params?: {
    startDate?: string
    endDate?: string
    materialName?: string
    quantityUsed?: boolean
    page?: number
    limit?: number
  }): Promise<{ records: SiteRecord[]; total: number; page: number; totalPages: number }> => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.materialName) queryParams.append('materialName', params.materialName)
    if (params?.quantityUsed) queryParams.append('quantityUsed', 'true')
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    
    const { data } = await api.get(`/site-records/my?${queryParams.toString()}`)
    return data
  },

  // Create new site record
  createSiteRecord: async (recordData: {
    site_id: string
    material_id?: string
    materialName: string
    quantityReceived: number
    quantityUsed: number
    date: string
    notes?: string
  }): Promise<SiteRecord> => {
    // Backend expects siteId (camelCase), not site_id
    const { site_id, ...rest } = recordData
    const payload = { ...rest, siteId: site_id }
    const { data } = await api.post('/site-records', payload)
    return data
  },

  // Get dashboard stats
  getDashboardStats: async (): Promise<{
    totalReceivedThisMonth: number
    totalUsedThisMonth: number
    pendingRecords: number
    recentActivity: SiteRecord[]
  }> => {
    const { data } = await api.get('/site-records/dashboard-stats')
    return data
  },

  // Get site inventory (materials available from PO receipts)
  getSiteInventory: async (): Promise<{
    inventory: Array<{
      materialName: string
      siteId: string
      siteName: string
      totalReceived: number
      totalUsed: number
      remainingQuantity: number
      lastReceivedDate: string
    }>
  }> => {
    const { data } = await api.get('/site-records/inventory/my')
    return data
  },

  // Record usage against available materials
  recordUsage: async (usageData: {
    siteId: string
    materialName: string
    quantityUsed: number
    date: string
    notes?: string
  }): Promise<{
    id: string
    site_id: string
    materialName: string
    quantityUsed: number
    date: string
    notes: string
    availableQuantity: number
    createdAt: string
  }> => {
    const { data } = await api.post('/site-records/usage', usageData)
    return data
  },
}

export const materialsApi = {
  // Get all materials for dropdown
  getMaterials: async (): Promise<Material[]> => {
    const { data } = await api.get('/materials')
    return data
  },

  // Search materials
  searchMaterials: async (query: string): Promise<Material[]> => {
    const { data } = await api.get(`/materials/search?q=${encodeURIComponent(query)}`)
    return data
  },
}
