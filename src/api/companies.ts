import { api } from './axios';

export interface Company {
  _id?: string;
  id?: string; // From auth API
  name: string;
  logo?: string;
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
};

export default companiesApi;
