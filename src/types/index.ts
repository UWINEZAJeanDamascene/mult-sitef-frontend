export enum UserRole {
  SITE_MANAGER = 'site_manager',
  MAIN_MANAGER = 'main_manager',
  ACCOUNTANT = 'accountant',
  MANAGER = 'manager',
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  company_id: string;
  assignedSiteIds?: string[];
  isActive: boolean;
  createdAt?: string;
  // Profile fields
  profilePicture?: string;
  phone?: string;
  department?: string;
  jobTitle?: string;
  bio?: string;
  location?: string;
  // Company data (populated by backend)
  company?: {
    id: string;
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    taxId?: string;
    industry?: string;
    description?: string;
  };
}

export interface JwtPayload {
  userId: string;
  role: UserRole;
  company_id: string;
  assignedSiteIds?: string[];
  exp: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
  company_id: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  role: UserRole;
  company_id: string;
  assignedSiteIds?: string[];
}

export interface Site {
  _id: string;
  name: string;
  location?: string;
  description?: string;
  company_id: string;
  createdBy: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Material {
  _id: string;
  name: string;
  unit: string;
  description?: string;
  company_id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SiteRecord {
  _id: string;
  site_id: string;
  material_id?: string;
  materialName: string;
  quantityReceived: number;
  quantityUsed: number;
  date: string;
  notes?: string;
  recordedBy: string;
  recordedByName?: string;
  company_id: string;
  syncedToMainStock: boolean;
  mainStockEntryId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MainStockRecord {
  _id: string;
  source: 'site' | 'direct';
  site_id?: string;
  siteRecord_id?: string;
  material_id?: string;
  materialName: string;
  quantityReceived: number;
  quantityUsed: number;
  price?: number | null;
  totalValue?: number | null;
  date: string;
  status: 'pending_price' | 'priced' | 'direct';
  notes?: string;
  recordedBy: string;
  company_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface UsedMaterialsView {
  materialName: string;
  material_id?: string;
  totalQuantityUsed: number;
  avgPrice: number;
  totalValue: number;
  recordCount: number;
  siteBreakdown: Array<{
    site_id: string;
    source: string;
    quantityUsed: number;
  }>;
}

export interface StockMovement {
  _id: string;
  mainStock_id: string;
  type: 'received' | 'used' | 'price_update';
  quantity?: number;
  previousPrice?: number;
  newPrice?: number;
  previousTotalValue?: number;
  newTotalValue?: number;
  date: string;
  recordedBy: string;
  notes?: string;
  createdAt: string;
}

export interface RemainingMaterialsView {
  materialName: string;
  material_id?: string;
  totalReceived: number;
  totalUsed: number;
  remainingQuantity: number;
  avgPrice: number;
  remainingValue: number;
  siteBreakdown: Array<{
    site_id: string;
    source: string;
    received: number;
    used: number;
    remaining: number;
  }>;
}

// Re-export action log types
export {
  ActionType,
  ResourceType,
  type ActionLog,
  type ActionLogStats,
  type ActionLogsFilter,
} from './actionLog'

// Supplier Type
export interface Supplier {
  id: string;
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
  company_id: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierDto {
  name: string;
  contactPerson?: string;
  email?: string;
  phone?: string;
  address?: string;
}

// Purchase Order Types
export interface POItem {
  _id?: string;
  materialName: string;
  material_id?: string;
  description?: string;
  quantityOrdered: number;
  quantityReceived: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  notes?: string;
}

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplier: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  site: {
    _id: string;
    name: string;
    location?: string;
  };
  status: 'draft' | 'sent' | 'partial' | 'received' | 'completed' | 'cancelled';
  items: POItem[];
  subTotal: number;
  taxRate: number;
  taxAmount: number;
  totalAmount: number;
  notes?: string;
  terms?: string;
  sentDate?: string;
  expectedDeliveryDate?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Delivery Note Types
export interface DeliveryNoteItem {
  materialName: string;
  material_id?: string;
  quantityOrdered: number;
  quantityDelivered: number;
  unit: string;
  unitPrice: number;
  totalPrice?: number;
  condition?: 'good' | 'damaged' | 'partial';
  notes?: string;
}

export interface DeliveryNote {
  id: string;
  dnNumber: string;
  poId: string;
  poNumber: string;
  supplier: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  site: {
    _id: string;
    name: string;
    location?: string;
  };
  items: DeliveryNoteItem[];
  deliveryDate: string;
  receivedBy: string;
  receivedByName?: string;
  carrier?: string;
  trackingNumber?: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
  attachments?: string[];
  subTotal?: number;
  taxRate?: number;
  taxAmount?: number;
  totalAmount?: number;
  company_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDeliveryNoteDto {
  poId: string;
  items: {
    materialName: string;
    material_id?: string;
    quantityOrdered: number;
    quantityDelivered: number;
    unit: string;
    unitPrice: number;
    condition?: 'good' | 'damaged' | 'partial';
    notes?: string;
  }[];
  deliveryDate: string;
  carrier?: string;
  trackingNumber?: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
  attachments?: string[];
}

// Purchase Return Types
export interface PurchaseReturnItem {
  materialName: string;
  material_id?: string;
  quantityReturned: number;
  unit: string;
  unitPrice: number;
  reason: 'defective' | 'wrong_item' | 'overage' | 'other';
  notes?: string;
}

export interface PurchaseReturn {
  id: string;
  returnNumber: string;
  poId: string;
  poNumber: string;
  supplier: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
  };
  site: {
    _id: string;
    name: string;
    location?: string;
  };
  items: PurchaseReturnItem[];
  returnDate: string;
  returnedBy: string;
  returnedByName?: string;
  carrier?: string;
  trackingNumber?: string;
  condition: 'good' | 'damaged' | 'partial';
  refundStatus: 'pending' | 'processed' | 'refunded';
  refundAmount?: number;
  notes?: string;
  attachments?: string[];
  company_id: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePurchaseReturnDto {
  poId: string;
  items: {
    materialName: string;
    material_id?: string;
    quantityReturned: number;
    unit: string;
    unitPrice: number;
    reason: 'defective' | 'wrong_item' | 'overage' | 'other';
    notes?: string;
  }[];
  returnDate: string;
  carrier?: string;
  trackingNumber?: string;
  condition: 'good' | 'damaged' | 'partial';
  notes?: string;
  attachments?: string[];
}

export interface CreatePODto {
  supplier: {
    name: string;
    contactPerson?: string;
    email?: string;
    phone?: string;
    address?: string;
  };
  site_id: string;
  items: Omit<POItem, '_id' | 'quantityReceived' | 'totalPrice'>[];
  taxRate?: number;
  notes?: string;
  terms?: string;
  expectedDeliveryDate?: string;
}

export interface ReceiveItemsDto {
  receivedItems: {
    itemId: string;
    quantity: number;
  }[];
  date?: string;
  notes?: string;
}
