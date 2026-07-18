import { api } from './axios';

export interface Company {
  _id?: string;
  id?: string; // From auth API
  name: string;
  logo?: string;
  signatureImage?: string;
  stampImage?: string;
  footerImage?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  industry?: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateCompanyData {
  name?: string;
  address?: string;
  phone?: string;
  email?: string;
  website?: string;
  taxId?: string;
  industry?: string;
  description?: string;
  logo?: string;
  signatureImage?: string;
  stampImage?: string;
  footerImage?: string;
}

export const companiesApi = {
  // Get company details
  getCompany: async (id: string): Promise<Company> => {
    const response = await api.get(`/companies/${id}`);
    return response.data;
  },

  // Update company
  updateCompany: async (id: string, data: UpdateCompanyData): Promise<Company> => {
    const response = await api.patch(`/companies/${id}`, data);
    return response.data;
  },

  // Upload company logo
  uploadLogo: async (id: string, image: string): Promise<{ logo: string }> => {
    const response = await api.post(`/companies/${id}/logo`, { image });
    return response.data;
  },

  // Upload company signature
  uploadSignature: async (id: string, image: string): Promise<{ signatureImage: string }> => {
    const response = await api.post(`/companies/${id}/signature`, { image });
    return response.data;
  },

  // Upload company stamp
  uploadStamp: async (id: string, image: string): Promise<{ stampImage: string }> => {
    const response = await api.post(`/companies/${id}/stamp`, { image });
    return response.data;
  },

  // Upload company footer image
  uploadFooter: async (id: string, image: string): Promise<{ footerImage: string }> => {
    const response = await api.post(`/companies/${id}/footer`, { image });
    return response.data;
  },

  // Delete company logo
  deleteLogo: async (id: string): Promise<{ logo: null }> => {
    const response = await api.delete(`/companies/${id}/logo`);
    return response.data;
  },

  // Delete company signature
  deleteSignature: async (id: string): Promise<{ signatureImage: null }> => {
    const response = await api.delete(`/companies/${id}/signature`);
    return response.data;
  },

  // Delete company stamp
  deleteStamp: async (id: string): Promise<{ stampImage: null }> => {
    const response = await api.delete(`/companies/${id}/stamp`);
    return response.data;
  },

  // Delete company footer image
  deleteFooter: async (id: string): Promise<{ footerImage: null }> => {
    const response = await api.delete(`/companies/${id}/footer`);
    return response.data;
  },
};

export default companiesApi;
