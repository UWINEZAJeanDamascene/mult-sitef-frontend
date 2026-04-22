import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Edit2, Users, Power, PowerOff, Search, X, Building2, MapPin, Loader2, UserPlus } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { sitesManagerApi } from '@/api/mainManager'
import { DataTable, Column } from '@/components/DataTable'
import { ModalWrapper } from '@/components/ModalWrapper'
import { InputField } from '@/components/FormField'
import { StatusBadge } from '@/components/StatusBadge'
import { TableSkeleton } from '@/components/Skeleton'
import { format } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { Site } from '@/types'

// Validation schemas
const createSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
})

const editSiteSchema = z.object({
  name: z.string().min(1, 'Site name is required'),
  location: z.string().min(1, 'Location is required'),
  description: z.string().optional(),
})

type CreateSiteForm = z.infer<typeof createSiteSchema>
type EditSiteForm = z.infer<typeof editSiteSchema>

interface SiteWithManagers extends Site {
  assignedManagers?: Array<{ id: string; name: string; email: string }>
}

// Create Site Modal
function CreateSiteModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<CreateSiteForm>({
    resolver: zodResolver(createSiteSchema),
  })

  const createMutation = useMutation({
    mutationFn: sitesManagerApi.createSite,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sites'] })
      toast.success('Site created successfully')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create site')
    },
  })

  const onSubmit = (data: CreateSiteForm) => {
    createMutation.mutate(data)
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Site"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Site Name"
          {...register('name')}
          error={errors.name}
          required
        />
        <InputField
          label="Location"
          {...register('location')}
          error={errors.location}
          required
        />
        <InputField
          label="Description"
          {...register('description')}
          error={errors.description}
        />
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create Site'
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Edit Site Modal
function EditSiteModal({
  isOpen,
  onClose,
  site,
}: {
  isOpen: boolean
  onClose: () => void
  site: Site | null
}) {
  const queryClient = useQueryClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditSiteForm>({
    resolver: zodResolver(editSiteSchema),
    defaultValues: {
      name: site?.name || '',
      location: site?.location || '',
      description: site?.description || '',
    },
  })

  const updateMutation = useMutation({
    mutationFn: (data: EditSiteForm) =>
      sitesManagerApi.updateSite(site!._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sites'] })
      toast.success('Site updated successfully')
      reset()
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update site')
    },
  })

  const onSubmit = (data: EditSiteForm) => {
    updateMutation.mutate(data)
  }

  if (!site) return null

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Site"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Site Name"
          {...register('name')}
          error={errors.name}
          required
        />
        <InputField
          label="Location"
          {...register('location')}
          error={errors.location}
          required
        />
        <InputField
          label="Description"
          {...register('description')}
          error={errors.description}
        />
        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || updateMutation.isPending}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {updateMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Assign Manager Modal
function AssignManagerModal({
  isOpen,
  onClose,
  site,
}: {
  isOpen: boolean
  onClose: () => void
  site: Site | null
}) {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedManager, setSelectedManager] = useState<string | null>(null)

  const { data: availableManagers, isLoading } = useQuery({
    queryKey: ['available-managers'],
    queryFn: sitesManagerApi.getAvailableManagers,
    enabled: isOpen,
  })

  const { data: currentManagers } = useQuery({
    queryKey: ['site-managers', site?._id],
    queryFn: () => sitesManagerApi.getSiteManagers(site!._id),
    enabled: isOpen && !!site,
  })

  const assignMutation = useMutation({
    mutationFn: (userId: string) =>
      sitesManagerApi.assignManager(site!._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-managers', site?._id] })
      queryClient.invalidateQueries({ queryKey: ['all-sites'] })
      toast.success('Site manager assigned successfully')
      setSelectedManager(null)
      setSearchQuery('')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to assign manager')
    },
  })

  const removeMutation = useMutation({
    mutationFn: (userId: string) =>
      sitesManagerApi.removeManager(site!._id, userId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['site-managers', site?._id] })
      queryClient.invalidateQueries({ queryKey: ['all-sites'] })
      toast.success('Site manager removed successfully')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to remove manager')
    },
  })

  const filteredManagers = useMemo(() => {
    if (!availableManagers) return []
    const currentManagerIds = new Set(currentManagers?.map(m => m.id) || [])
    return availableManagers
      .filter(m => !currentManagerIds.has(m.id))
      .filter(m =>
        searchQuery === '' ||
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
  }, [availableManagers, currentManagers, searchQuery])

  if (!site) return null

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Managers - ${site.name}`}
      maxWidth="lg"
    >
      <div className="space-y-6">
        {/* Current Managers */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">
            Currently Assigned Managers
          </h4>
          {currentManagers?.length === 0 ? (
            <p className="text-sm text-muted-foreground italic">No managers assigned</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {currentManagers?.map((manager) => (
                <div
                  key={manager.id}
                  className="flex items-center gap-2 px-3 py-2 bg-primary/10 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">
                      {manager.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                  <button
                    onClick={() => removeMutation.mutate(manager.id)}
                    disabled={removeMutation.isPending}
                    className="p-1 text-destructive hover:bg-destructive/10 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Add New Manager */}
        <div className="border-t border-border pt-4">
          <h4 className="text-sm font-medium text-foreground mb-3">
            Add Manager
          </h4>
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search site managers..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg text-sm bg-background"
            />
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 bg-muted rounded animate-pulse" />
              ))}
            </div>
          ) : filteredManagers.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              {searchQuery
                ? 'No managers found matching your search'
                : 'All available managers are already assigned'}
            </p>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-border rounded-lg divide-y divide-border">
              {filteredManagers.map((manager) => (
                <button
                  key={manager.id}
                  onClick={() => setSelectedManager(manager.id)}
                  className={`w-full px-4 py-3 flex items-center justify-between hover:bg-muted ${
                    selectedManager === manager.id ? 'bg-primary/10' : ''
                  }`}
                >
                  <div className="text-left">
                    <p className="text-sm font-medium text-foreground">
                      {manager.name}
                    </p>
                    <p className="text-xs text-muted-foreground">{manager.email}</p>
                  </div>
                  {selectedManager === manager.id && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        assignMutation.mutate(manager.id)
                      }}
                      disabled={assignMutation.isPending}
                      className="px-3 py-1 bg-primary text-primary-foreground text-sm rounded hover:bg-primary/90"
                    >
                      {assignMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Assign'
                      )}
                    </button>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-foreground hover:bg-muted rounded-lg font-medium"
          >
            Done
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export function SitesManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingSite, setEditingSite] = useState<Site | null>(null)
  const [assigningSite, setAssigningSite] = useState<Site | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: sites, isLoading } = useQuery({
    queryKey: ['all-sites'],
    queryFn: sitesManagerApi.getAllSites,
  })

  // Get managers for each site
  const { data: sitesWithManagers, isLoading: managersLoading } = useQuery({
    queryKey: ['sites-with-managers'],
    queryFn: async () => {
      if (!sites) return []
      const sitesData = await Promise.all(
        sites.map(async (site) => {
          try {
            const managers = await sitesManagerApi.getSiteManagers(site._id)
            return { ...site, assignedManagers: managers }
          } catch {
            return { ...site, assignedManagers: [] }
          }
        })
      )
      return sitesData
    },
    enabled: !!sites,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ siteId, isActive }: { siteId: string; isActive: boolean }) =>
      sitesManagerApi.toggleSiteActive(siteId, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-sites'] })
      queryClient.invalidateQueries({ queryKey: ['sites-with-managers'] })
      toast.success('Site status updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update site status')
    },
  })

  const filteredSites = useMemo(() => {
    if (!sitesWithManagers) return []
    if (!searchQuery) return sitesWithManagers
    return sitesWithManagers.filter(
      (site) =>
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.location?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [sitesWithManagers, searchQuery])

  const columns: Column<SiteWithManagers>[] = [
    {
      key: 'name',
      header: 'Site Name',
      sortable: true,
      render: (site) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{site.name}</p>
            {site.description && (
              <p className="text-xs text-muted-foreground line-clamp-1">
                {site.description}
              </p>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'location',
      header: 'Location',
      sortable: true,
      render: (site) => (
        <div className="flex items-center gap-1 text-muted-foreground">
          <MapPin className="w-4 h-4" />
          {site.location || '-'}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (site) => (
        <StatusBadge
          status={site.isActive ? 'active' : 'inactive'}
          customLabel={site.isActive ? 'Active' : 'Inactive'}
        />
      ),
    },
    {
      key: 'assignedManagers',
      header: 'Assigned Managers',
      render: (site) => (
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {site.assignedManagers?.length || 0} manager
            {site.assignedManagers?.length !== 1 ? 's' : ''}
          </span>
        </div>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (site) => (
        <span className="text-sm text-muted-foreground">
          {site.createdAt ? format.date(site.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (site) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => setEditingSite(site)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Edit site"
          >
            <Edit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setAssigningSite(site)}
            className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-lg"
            title="Assign managers"
          >
            <UserPlus className="w-4 h-4" />
          </button>
          <button
            onClick={() =>
              toggleActiveMutation.mutate({
                siteId: site._id,
                isActive: !site.isActive,
              })
            }
            disabled={toggleActiveMutation.isPending}
            className={`p-2 rounded-lg ${
              site.isActive
                ? 'text-amber-600 dark:text-amber-400 hover:bg-amber-500/10'
                : 'text-green-600 dark:text-green-400 hover:bg-green-500/10'
            }`}
            title={site.isActive ? 'Deactivate site' : 'Activate site'}
          >
            {site.isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ]

  if (isLoading || managersLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Sites Management</h1>
            <p className="text-muted-foreground mt-1">Manage sites and assign managers</p>
          </div>
          <div className="h-10 w-32 bg-muted rounded-lg animate-pulse" />
        </div>
        <TableSkeleton rows={5} columns={6} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sites Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage sites and assign managers
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          <Plus className="w-5 h-5" />
          Create New Site
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search sites by name or location..."
          className="w-full pl-10 pr-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary focus:border-primary bg-background text-foreground"
        />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Sites</p>
          <p className="text-2xl font-bold text-foreground">{sites?.length || 0}</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Active Sites</p>
          <p className="text-2xl font-bold text-green-600 dark:text-green-400">
            {sites?.filter((s) => s.isActive).length || 0}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Inactive Sites</p>
          <p className="text-2xl font-bold text-muted-foreground">
            {sites?.filter((s) => !s.isActive).length || 0}
          </p>
        </div>
      </div>

      {/* Sites Table */}
      <DataTable
        columns={columns}
        data={filteredSites}
        keyExtractor={(site) => site._id}
        searchable={false}
        emptyState={
          <div className="text-center py-12">
            <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground">No sites found</h3>
            <p className="text-muted-foreground mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first site to get started'}
            </p>
          </div>
        }
      />

      {/* Modals */}
      <CreateSiteModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
      <EditSiteModal
        isOpen={!!editingSite}
        onClose={() => setEditingSite(null)}
        site={editingSite}
      />
      <AssignManagerModal
        isOpen={!!assigningSite}
        onClose={() => setAssigningSite(null)}
        site={assigningSite}
      />
    </div>
  )
}
