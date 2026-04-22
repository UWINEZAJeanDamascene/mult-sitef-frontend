import { api } from './axios'
import type { 
  MainStockRecord, 
  Site, 
  SiteRecord, 
  Material, 
  User, 
  UsedMaterialsView, 
  RemainingMaterialsView,
  StockMovement 
} from '@/types'

// Dashboard API
export const dashboardApi = {
  getStats: async (): Promise<{
    totalStockValue: number
    pendingPricingCount: number
    activeSitesCount: number
    directRecordsThisMonth: number
  }> => {
    const { data } = await api.get('/main-stock/dashboard-stats')
    return data
  },

  getTopMaterials: async (limit = 10): Promise<Array<{
    materialName: string
    quantityReceived: number
  }>> => {
    const { data } = await api.get(`/main-stock/top-materials?limit=${limit}`)
    return data
  },

  getStockMovements: async (days = 30): Promise<Array<{
    date: string
    received: number
    used: number
  }>> => {
    const { data } = await api.get(`/main-stock/movements?days=${days}`)
    return data
  },
}

// Sites API for main manager
export const sitesManagerApi = {
  getAllSites: async (): Promise<Site[]> => {
    const { data } = await api.get('/sites')
    return data
  },

  getSiteDetails: async (siteId: string): Promise<{
    site: Site
    records: SiteRecord[]
    stats: {
      recordsThisMonth: number
      pendingPriceCount: number
      lastActivityDate: string | null
    }
  }> => {
    const { data } = await api.get(`/sites/${siteId}/details`)
    return data
  },

  createSite: async (siteData: {
    name: string
    location: string
    description?: string
  }): Promise<Site> => {
    const { data } = await api.post('/sites', siteData)
    return data
  },

  updateSite: async (siteId: string, siteData: Partial<Site>): Promise<Site> => {
    const { data } = await api.put(`/sites/${siteId}`, siteData)
    return data
  },

  toggleSiteActive: async (siteId: string, isActive: boolean): Promise<Site> => {
    const { data } = await api.patch(`/sites/${siteId}/active`, { isActive })
    return data
  },

  assignManager: async (siteId: string, userId: string): Promise<void> => {
    await api.post(`/sites/${siteId}/assign`, { userId })
  },

  removeManager: async (siteId: string, userId: string): Promise<void> => {
    await api.delete(`/sites/${siteId}/assign/${userId}`)
  },

  getSiteManagers: async (siteId: string): Promise<Array<{
    id: string
    name: string
    email: string
    role: string
    isActive: boolean
  }>> => {
    const { data } = await api.get(`/sites/${siteId}/managers`)
    return data
  },

  getAvailableManagers: async (): Promise<Array<{
    id: string
    name: string
    email: string
  }>> => {
    const { data } = await api.get('/sites/managers/available')
    return data
  },
}

// Main Stock Records API
export const mainStockApi = {
  getRecords: async (params?: {
    page?: number
    limit?: number
    source?: 'all' | 'site' | 'direct'
    status?: 'all' | 'pending_price' | 'priced' | 'direct'
    startDate?: string
    endDate?: string
    materialName?: string
  }): Promise<{
    records: MainStockRecord[]
    total: number
    page: number
    totalPages: number
  }> => {
    const queryParams = new URLSearchParams()
    if (params?.page) queryParams.append('page', params.page.toString())
    if (params?.limit) queryParams.append('limit', params.limit.toString())
    if (params?.source && params.source !== 'all') queryParams.append('source', params.source)
    if (params?.status && params.status !== 'all') queryParams.append('status', params.status)
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    if (params?.materialName) queryParams.append('materialName', params.materialName)
    
    const { data } = await api.get(`/main-stock?${queryParams.toString()}`)
    return data
  },

  getRecordById: async (id: string): Promise<MainStockRecord> => {
    const { data } = await api.get(`/main-stock/${id}`)
    return data
  },

  updatePrice: async (id: string, price: number): Promise<MainStockRecord> => {
    const { data } = await api.patch(`/main-stock/${id}/price`, { price })
    return data
  },

  markAsReceived: async (id: string, price?: number): Promise<MainStockRecord> => {
    const { data } = await api.patch(`/main-stock/${id}/receive`, { price })
    return data
  },

  createDirectRecord: async (recordData: {
    materialName: string
    material_id?: string
    quantityReceived: number
    quantityUsed: number
    price: number
    date: string
    notes?: string
  }): Promise<MainStockRecord> => {
    const { data } = await api.post('/main-stock/direct', recordData)
    return data
  },

  getStockMovements: async (recordId: string): Promise<StockMovement[]> => {
    const { data } = await api.get(`/main-stock/${recordId}/movements`)
    return data
  },
}

// Views API
export const viewsApi = {
  getUsedMaterials: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<UsedMaterialsView[]> => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const { data } = await api.get(`/views/used?${queryParams.toString()}`)
    return data
  },

  getRemainingMaterials: async (params?: {
    startDate?: string
    endDate?: string
  }): Promise<RemainingMaterialsView[]> => {
    const queryParams = new URLSearchParams()
    if (params?.startDate) queryParams.append('startDate', params.startDate)
    if (params?.endDate) queryParams.append('endDate', params.endDate)
    
    const { data } = await api.get(`/views/remaining?${queryParams.toString()}`)
    return data
  },
}

// Materials Catalog API
export const materialsCatalogApi = {
  getMaterials: async (): Promise<Material[]> => {
    const { data } = await api.get('/materials')
    return data
  },

  createMaterial: async (materialData: {
    name: string
    unit: string
    description?: string
  }): Promise<Material> => {
    const { data } = await api.post('/materials', materialData)
    return data
  },

  updateMaterial: async (id: string, materialData: Partial<Material>): Promise<Material> => {
    const { data } = await api.put(`/materials/${id}`, materialData)
    return data
  },

  toggleMaterialActive: async (id: string, isActive: boolean): Promise<Material> => {
    const { data } = await api.patch(`/materials/${id}/active`, { isActive })
    return data
  },
}

// Users Management API
export const usersManagerApi = {
  getUsers: async (): Promise<User[]> => {
    const { data } = await api.get('/auth/users')
    return data
  },

  createUser: async (userData: {
    name: string
    email: string
    password: string
    role: string
    company_id: string
    assignedSiteIds?: string[]
  }): Promise<User> => {
    const { data } = await api.post('/auth/register', userData)
    return data
  },

  updateUser: async (id: string, userData: Partial<User>): Promise<User> => {
    const { data } = await api.put(`/auth/users/${id}`, userData)
    return data
  },

  updateUserRole: async (id: string, role: string, assignedSiteIds?: string[]): Promise<User> => {
    const { data } = await api.patch(`/auth/users/${id}/role`, { role, assignedSiteIds })
    return data
  },

  toggleUserActive: async (id: string, isActive: boolean): Promise<User> => {
    const { data } = await api.patch(`/auth/users/${id}/active`, { isActive })
    return data
  },

  assignSites: async (id: string, siteIds: string[]): Promise<User> => {
    const { data } = await api.post(`/auth/users/${id}/sites`, { siteIds })
    return data
  },
}
