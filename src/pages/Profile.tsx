import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Camera,
  User,
  Mail,
  Phone,
  Briefcase,
  Building,
  MapPin,
  FileText,
  Loader2,
  Save,
  X,
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'
import { authApi } from '@/api/auth'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const profileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  department: z.string().optional(),
  jobTitle: z.string().optional(),
  bio: z.string().max(500, 'Bio must be less than 500 characters').optional(),
  location: z.string().optional(),
})

type ProfileFormData = z.infer<typeof profileSchema>

export function Profile() {
  const navigate = useNavigate()
  const { user, updateUser } = useAuth()
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: authApi.getProfile,
    initialData: user || undefined,
  })

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile?.name || '',
      phone: profile?.phone || '',
      department: profile?.department || '',
      jobTitle: profile?.jobTitle || '',
      bio: profile?.bio || '',
      location: profile?.location || '',
    },
  })

  // Update form when profile data loads
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || '',
        phone: profile.phone || '',
        department: profile.department || '',
        jobTitle: profile.jobTitle || '',
        bio: profile.bio || '',
        location: profile.location || '',
      })
      setPreviewImage(profile.profilePicture || null)
    }
  }, [profile, reset])

  const updateProfileMutation = useMutation({
    mutationFn: authApi.updateProfile,
    onSuccess: (data) => {
      updateUser(data)
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    },
    onError: () => {
      toast.error('Failed to update profile')
    },
  })

  const uploadPictureMutation = useMutation({
    mutationFn: authApi.uploadProfilePicture,
    onSuccess: (data) => {
      setPreviewImage(data.profilePicture)
      updateUser({ profilePicture: data.profilePicture })
      queryClient.invalidateQueries({ queryKey: ['profile'] })
      toast.success('Profile picture updated')
    },
    onError: () => {
      toast.error('Failed to upload picture')
    },
  })

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const handleImageClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Image must be less than 5MB')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = () => {
      const base64 = reader.result as string
      setPreviewImage(base64)
      uploadPictureMutation.mutate(base64)
    }
    reader.readAsDataURL(file)
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5 text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-col items-center">
              {/* Profile Picture */}
              <div className="relative mb-4">
                <div
                  onClick={handleImageClick}
                  className={cn(
                    'w-32 h-32 rounded-full overflow-hidden cursor-pointer',
                    'border-4 border-background shadow-lg',
                    'group relative'
                  )}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-primary/10 flex items-center justify-center">
                      <span className="text-3xl font-bold text-primary">
                        {getInitials(profile?.name || 'U')}
                      </span>
                    </div>
                  )}
                  {/* Hover Overlay */}
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Camera className="w-6 h-6 text-white" />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
                {uploadPictureMutation.isPending && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-full">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>

              <h2 className="text-xl font-semibold text-foreground">
                {profile?.name}
              </h2>
              <p className="text-muted-foreground">{profile?.email}</p>
              <p className="text-sm text-muted-foreground mt-1 capitalize">
                {profile?.role.replace('_', ' ')}
              </p>

              {profile?.bio && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  {profile.bio}
                </p>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-border space-y-3">
              {profile?.phone && (
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.phone}</span>
                </div>
              )}
              {profile?.department && (
                <div className="flex items-center gap-3 text-sm">
                  <Building className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.department}</span>
                </div>
              )}
              {profile?.jobTitle && (
                <div className="flex items-center gap-3 text-sm">
                  <Briefcase className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.jobTitle}</span>
                </div>
              )}
              {profile?.location && (
                <div className="flex items-center gap-3 text-sm">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <span>{profile.location}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <div className="lg:col-span-2">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-foreground">
                Profile Information
              </h3>
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm font-medium"
                >
                  Edit Profile
                </button>
              )}
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <span className="flex items-center gap-2">
                    <User className="w-4 h-4" />
                    Full Name *
                  </span>
                </label>
                <input
                  {...register('name')}
                  disabled={!isEditing}
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-background',
                    !isEditing && 'opacity-60 cursor-not-allowed',
                    errors.name ? 'border-destructive' : 'border-input'
                  )}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-destructive">{errors.name.message}</p>
                )}
              </div>

              {/* Email (read-only) */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <span className="flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    Email Address
                  </span>
                </label>
                <input
                  value={profile?.email}
                  disabled
                  className="w-full px-4 py-2 border border-input rounded-lg bg-muted opacity-60 cursor-not-allowed"
                />
              </div>

              {/* Phone & Location */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      Phone Number
                    </span>
                  </label>
                  <input
                    {...register('phone')}
                    disabled={!isEditing}
                    placeholder="+1 (555) 000-0000"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-background',
                      !isEditing && 'opacity-60 cursor-not-allowed',
                      'border-input'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Location
                    </span>
                  </label>
                  <input
                    {...register('location')}
                    disabled={!isEditing}
                    placeholder="City, Country"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-background',
                      !isEditing && 'opacity-60 cursor-not-allowed',
                      'border-input'
                    )}
                  />
                </div>
              </div>

              {/* Department & Job Title */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-2">
                      <Building className="w-4 h-4" />
                      Department
                    </span>
                  </label>
                  <input
                    {...register('department')}
                    disabled={!isEditing}
                    placeholder="e.g., Engineering"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-background',
                      !isEditing && 'opacity-60 cursor-not-allowed',
                      'border-input'
                    )}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    <span className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4" />
                      Job Title
                    </span>
                  </label>
                  <input
                    {...register('jobTitle')}
                    disabled={!isEditing}
                    placeholder="e.g., Site Manager"
                    className={cn(
                      'w-full px-4 py-2 border rounded-lg bg-background',
                      !isEditing && 'opacity-60 cursor-not-allowed',
                      'border-input'
                    )}
                  />
                </div>
              </div>

              {/* Bio */}
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  <span className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Bio
                  </span>
                </label>
                <textarea
                  {...register('bio')}
                  disabled={!isEditing}
                  rows={4}
                  placeholder="Tell us about yourself..."
                  className={cn(
                    'w-full px-4 py-2 border rounded-lg bg-background resize-none',
                    !isEditing && 'opacity-60 cursor-not-allowed',
                    errors.bio ? 'border-destructive' : 'border-input'
                  )}
                />
                {errors.bio && (
                  <p className="mt-1 text-sm text-destructive">{errors.bio.message}</p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Brief description for your profile. Max 500 characters.
                </p>
              </div>

              {/* Action Buttons */}
              {isEditing && (
                <div className="flex items-center gap-4 pt-4 border-t border-border">
                  <button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
                  >
                    {updateProfileMutation.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        Save Changes
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false)
                      reset()
                    }}
                    disabled={updateProfileMutation.isPending}
                    className="flex items-center gap-2 px-6 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
