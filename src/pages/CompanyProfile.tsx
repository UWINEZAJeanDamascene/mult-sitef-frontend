import { useState, useCallback, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useAuth } from '@/context/AuthContext';
import { companiesApi, type Company, type UpdateCompanyData } from '@/api/companies';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Box, Camera, Building2, Globe, Phone, Mail, MapPin, FileText, Building, Loader2, ArrowLeft } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { useRef } from 'react';

// Safely extract an error message from various error shapes (Axios, Error, string, unknown)
function extractErrorMessage(error: unknown, fallback = 'An error occurred') {
  if (!error) return fallback
  if (typeof error === 'string') return error
  if (typeof error === 'object') {
    const anyErr = error as any
    // Axios-style response
    const axiosMsg = anyErr?.response?.data?.error || anyErr?.response?.data?.message
    if (axiosMsg) return String(axiosMsg)
    if (anyErr?.message) return String(anyErr.message)
  }
  return fallback
}

export default function CompanyProfile() {
  const { company, user, updateCompany, isLoading: authLoading } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
    taxId: '',
    industry: '',
    description: '',
  });

  // Mutation for updating company profile
  const updateCompanyMutation = useMutation({
    mutationFn: async (data: UpdateCompanyData) => {
      const companyId = company?._id || company?.id || user?.company_id;
      console.debug('[CompanyProfile] updateCompanyMutation:', { companyId, company, userCompanyId: user?.company_id });
      if (!companyId) throw new Error('Company ID not found');
      return companiesApi.updateCompany(companyId, data);
    },
    onSuccess: (updated) => {
      console.debug('[CompanyProfile] updateCompanyMutation success:', updated);
      updateCompany(updated as Partial<Company>);
      toast.success('Company profile updated successfully');
      setIsEditing(false);
    },
    onError: (error) => {
      const message = extractErrorMessage(error, 'Failed to update company profile');
      toast.error(message);
      console.error('[CompanyProfile] update error:', error);
    },
  });

  // Mutation for uploading logo
  const uploadLogoMutation = useMutation({
    mutationFn: async (image: string) => {
      const companyId = company?._id || company?.id || user?.company_id;
      console.debug('[CompanyProfile] uploadLogoMutation:', { companyId });
      if (!companyId) throw new Error('Company ID not found');
      return companiesApi.uploadLogo(companyId, image);
    },
    onSuccess: (result) => {
      console.debug('[CompanyProfile] uploadLogoMutation success:', result);
      updateCompany({ logo: result.logo });
      toast.success('Company logo updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to upload logo');
      console.error('[CompanyProfile] upload error:', error);
    },
  });

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Initialize form data when company data is available
  useEffect(() => {
    if (company) {
      setFormData({
        name: company.name || '',
        address: company.address || '',
        phone: company.phone || '',
        email: company.email || '',
        website: company.website || '',
        taxId: company.taxId || '',
        industry: company.industry || '',
        description: company.description || '',
      });
    }
  }, [company]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }, []);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image size must be less than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64Image = reader.result as string;
      uploadLogoMutation.mutate(base64Image);
    };
    reader.readAsDataURL(file);
  }, [uploadLogoMutation]);

  const handleSave = useCallback(() => {
    updateCompanyMutation.mutate(formData);
  }, [formData, updateCompanyMutation]);

  const openFileDialog = useCallback(() => {
    if (uploadLogoMutation.isPending) return;
    if (fileInputRef.current) {
      console.debug('[CompanyProfile] Opening file dialog');
      fileInputRef.current.click();
    }
  }, [uploadLogoMutation.isPending]);

  // Only main managers and managers can edit
  const canEdit = user?.role === 'main_manager' || user?.role === 'manager';

  // Only show the global loading spinner while auth is initializing.
  // If no company is returned, render the form (empty) so users can see or edit profile.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading company information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Link
          to="/dashboard"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Company Profile</h1>
            <p className="text-muted-foreground mt-1">
              Manage your organization information
            </p>
          </div>
          {canEdit && !isEditing && (
            <Button onClick={() => setIsEditing(true)}>
              Edit Company Profile
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Company Logo Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Company Logo</CardTitle>
            <CardDescription>Your company brand identity</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden mb-4 relative">
                {company?.logo ? (
                  <img
                    src={company.logo || ''}
                    alt="Company Logo"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Box className="w-16 h-16 text-primary" />
                )}
              </div>
              {canEdit && isEditing && (
                <label className="absolute -bottom-2 -right-2 w-10 h-10 bg-primary text-primary-foreground rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors shadow-lg z-10">
                    <Camera className="w-5 h-5" onClick={openFileDialog} />
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      aria-label="Upload company logo"
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                      onChange={handleImageUpload}
                      disabled={uploadLogoMutation.isPending}
                    />
                </label>
              )}
            </div>
            <h2 className="text-xl font-semibold text-center">{company?.name || formData.name || 'Company'}</h2>
            {(company?.industry || formData.industry) && (
              <p className="text-sm text-muted-foreground mt-1">{company?.industry || formData.industry}</p>
            )}
          </CardContent>
        </Card>

        {/* Company Details */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Company Information</CardTitle>
            <CardDescription>
              {isEditing ? 'Edit your company details below' : 'View and manage company information'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company Name */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="name" className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  Company Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter company name"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="company@example.com"
                />
              </div>

              {/* Phone */}
              <div className="space-y-2">
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  Phone Number
                </Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              {/* Website */}
              <div className="space-y-2">
                <Label htmlFor="website" className="flex items-center gap-2">
                  <Globe className="w-4 h-4" />
                  Website
                </Label>
                <Input
                  id="website"
                  name="website"
                  value={formData.website}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="https://www.example.com"
                />
              </div>

              {/* Industry */}
              <div className="space-y-2">
                <Label htmlFor="industry" className="flex items-center gap-2">
                  <Building className="w-4 h-4" />
                  Industry
                </Label>
                <Input
                  id="industry"
                  name="industry"
                  value={formData.industry}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="e.g., Construction"
                />
              </div>

              {/* Tax ID */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="taxId" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Tax ID / VAT Number
                </Label>
                <Input
                  id="taxId"
                  name="taxId"
                  value={formData.taxId}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter tax ID or VAT number"
                />
              </div>

              {/* Address */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Address
                </Label>
                <Textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Enter company address"
                  rows={2}
                />
              </div>

              {/* Description */}
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="description" className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  Description
                </Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  disabled={!isEditing}
                  placeholder="Brief description of your company..."
                  rows={3}
                />
              </div>
            </div>

            {isEditing && (
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(false)}
                  disabled={updateCompanyMutation.isPending}
                >
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={updateCompanyMutation.isPending}>
                  {updateCompanyMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Changes'
                  )}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
