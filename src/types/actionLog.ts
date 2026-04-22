export enum ActionType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LOGIN = 'login',
  LOGOUT = 'logout',
  ASSIGN = 'assign',
  UNASSIGN = 'unassign',
  PRICE_UPDATE = 'price_update',
  SYNC = 'sync',
  EXPORT = 'export',
  IMPORT = 'import',
  VIEW = 'view',
  OTHER = 'other',
}

export enum ResourceType {
  SITE = 'site',
  SITE_RECORD = 'site_record',
  MAIN_STOCK = 'main_stock',
  MATERIAL = 'material',
  USER = 'user',
  SYSTEM = 'system',
}

export interface ActionLog {
  id: string
  userId: string
  userName: string
  userEmail: string
  userRole: string
  action: ActionType
  resource: ResourceType
  resourceId?: string
  resourceName?: string
  description: string
  details?: Record<string, any>
  ipAddress?: string
  timestamp: string
}

export interface ActionLogStats {
  totalActions: number
  actionStats: Array<{
    action: ActionType
    count: number
  }>
  resourceStats: Array<{
    resource: ResourceType
    count: number
  }>
  topUsers: Array<{
    userId: string
    userName: string
    userEmail: string
    actionCount: number
  }>
}

export interface ActionLogsFilter {
  page?: number
  limit?: number
  action?: ActionType
  resource?: ResourceType
  userId?: string
  startDate?: string
  endDate?: string
  search?: string
}
