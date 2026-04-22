import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Search, Users, Power, PowerOff, Loader2, UserPlus, Building2 } from 'lucide-react'
import { toast } from 'react-hot-toast'
import { usersManagerApi, sitesManagerApi } from '@/api/mainManager'
import { DataTable, Column } from '@/components/DataTable'
import { ModalWrapper } from '@/components/ModalWrapper'
import { InputField, SelectField } from '@/components/FormField'
import { StatusBadge } from '@/components/StatusBadge'
import { TableSkeleton } from '@/components/Skeleton'
import { format } from '@/lib/utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import type { User } from '@/types'

const roleOptions = [
  { value: '', label: 'Select role...', disabled: true },
  { value: 'site_manager', label: 'Site Manager' },
  { value: 'main_manager', label: 'Main Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'manager', label: 'Manager' },
]

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  role: z.enum(['site_manager', 'main_manager', 'accountant', 'manager']),
})

type UserForm = z.infer<typeof userSchema>

interface UserWithSites extends User {
  assignedSites?: Array<{ _id: string; name: string }>
}

// Create User Modal
function CreateUserModal({
  isOpen,
  onClose,
  companyId,
}: {
  isOpen: boolean
  onClose: () => void
  companyId: string
}) {
  const queryClient = useQueryClient()
  const [selectedSites, setSelectedSites] = useState<string[]>([])

  const { data: sites } = useQuery({
    queryKey: ['all-sites'],
    queryFn: sitesManagerApi.getAllSites,
    enabled: isOpen,
  })

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<UserForm>({
    resolver: zodResolver(userSchema),
  })

  const role = watch('role')

  const createMutation = useMutation({
    mutationFn: (data: UserForm) =>
      usersManagerApi.createUser({
        ...data,
        company_id: companyId,
        assignedSiteIds: selectedSites,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User created successfully')
      reset()
      setSelectedSites([])
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to create user')
    },
  })

  const onSubmit = (data: UserForm) => {
    createMutation.mutate(data)
  }

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title="Create New User"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <InputField
          label="Full Name"
          register={register('name')}
          error={errors.name}
          required
        />
        <InputField
          label="Email Address"
          type="email"
          register={register('email')}
          error={errors.email}
          required
        />
        <InputField
          label="Temporary Password"
          type="password"
          register={register('password')}
          error={errors.password}
          required
        />
        <SelectField
          label="Role"
          register={register('role')}
          options={roleOptions}
          error={errors.role}
          required
        />

        {/* Site selector for site managers */}
        {role === 'site_manager' && (
          <div className="border rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-gray-900">Assign Sites</h4>
              <span className="text-sm text-gray-500">
                {selectedSites.length} selected
              </span>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-2">
              {sites?.map((site) => (
                <div
                  key={site._id}
                  className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded"
                >
                  <input
                    type="checkbox"
                    id={`site-${site._id}`}
                    checked={selectedSites.includes(site._id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedSites([...selectedSites, site._id])
                      } else {
                        setSelectedSites(selectedSites.filter((id) => id !== site._id))
                      }
                    }}
                    className="w-4 h-4 text-indigo-600 rounded cursor-pointer"
                  />
                  <label htmlFor={`site-${site._id}`} className="flex-1 cursor-pointer">
                    <p className="text-sm font-medium text-gray-900">{site.name}</p>
                    <p className="text-xs text-gray-500">{site.location}</p>
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || createMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Create User'
            )}
          </button>
        </div>
      </form>
    </ModalWrapper>
  )
}

// Assign Sites Modal
function AssignSitesModal({
  isOpen,
  onClose,
  user,
}: {
  isOpen: boolean
  onClose: () => void
  user: UserWithSites | null
}) {
  const queryClient = useQueryClient()
  const [selectedSites, setSelectedSites] = useState<string[]>([])

  const { data: sites } = useQuery({
    queryKey: ['all-sites'],
    queryFn: sitesManagerApi.getAllSites,
    enabled: isOpen,
  })

  // Initialize selected sites from user data
  useMemo(() => {
    if (user?.assignedSites) {
      setSelectedSites(user.assignedSites.map((s) => s._id))
    } else {
      setSelectedSites([])
    }
  }, [user])

  const assignMutation = useMutation({
    mutationFn: (siteIds: string[]) =>
      usersManagerApi.assignSites(user!.id, siteIds),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('Sites assigned successfully')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to assign sites')
    },
  })

  if (!user) return null

  return (
    <ModalWrapper
      isOpen={isOpen}
      onClose={onClose}
      title={`Assign Sites - ${user.name}`}
      maxWidth="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select sites to assign to this user:
        </p>
        <div className="max-h-60 overflow-y-auto border rounded-lg divide-y">
          {sites?.map((site) => (
            <label
              key={site._id}
              className="flex items-center gap-3 p-3 hover:bg-gray-50 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={selectedSites.includes(site._id)}
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedSites([...selectedSites, site._id])
                  } else {
                    setSelectedSites(selectedSites.filter((id) => id !== site._id))
                  }
                }}
                className="w-4 h-4 text-indigo-600 rounded"
              />
              <div className="flex-1">
                <p className="font-medium text-gray-900">{site.name}</p>
                <p className="text-sm text-gray-500">{site.location}</p>
              </div>
            </label>
          ))}
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg font-medium"
          >
            Cancel
          </button>
          <button
            onClick={() => assignMutation.mutate(selectedSites)}
            disabled={assignMutation.isPending}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50"
          >
            {assignMutation.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Save Changes'
            )}
          </button>
        </div>
      </div>
    </ModalWrapper>
  )
}

export function UsersManagement() {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [assigningUser, setAssigningUser] = useState<UserWithSites | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const queryClient = useQueryClient()

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: usersManagerApi.getUsers,
  })

  const toggleActiveMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      usersManagerApi.toggleUserActive(id, isActive),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
      toast.success('User status updated')
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || 'Failed to update user status')
    },
  })

  const filteredUsers = useMemo(() => {
    if (!users) return []
    if (!searchQuery) return users
    return users.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
  }, [users, searchQuery])

  const columns: Column<UserWithSites>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (user) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{user.name}</p>
            <p className="text-sm text-gray-500">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (user) => (
        <StatusBadge status={user.role} />
      ),
    },
    {
      key: 'assignedSites',
      header: 'Assigned Sites',
      render: (user) => (
        <div className="flex items-center gap-1">
          {user.role === 'site_manager' ? (
            <>
              <Building2 className="w-4 h-4 text-gray-400" />
              <span className="text-sm text-gray-600">
                {user.assignedSites?.length || 0} site
                {user.assignedSites?.length !== 1 ? 's' : ''}
              </span>
            </>
          ) : (
            <span className="text-sm text-gray-400">All sites</span>
          )}
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user) => (
        <StatusBadge
          status={user.isActive ? 'active' : 'inactive'}
        />
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (user) => (
        <span className="text-sm text-gray-600">
          {user.createdAt ? format.date(user.createdAt) : '-'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (user) => (
        <div className="flex items-center gap-1">
          {user.role === 'site_manager' && (
            <button
              onClick={() => setAssigningUser(user)}
              className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
              title="Assign sites"
            >
              <UserPlus className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() =>
              toggleActiveMutation.mutate({
                id: user.id,
                isActive: !user.isActive,
              })
            }
            disabled={toggleActiveMutation.isPending}
            className={`p-2 rounded-lg ${
              user.isActive
                ? 'text-amber-600 hover:bg-amber-50'
                : 'text-green-600 hover:bg-green-50'
            }`}
            title={user.isActive ? 'Deactivate' : 'Activate'}
          >
            {user.isActive ? (
              <PowerOff className="w-4 h-4" />
            ) : (
              <Power className="w-4 h-4" />
            )}
          </button>
        </div>
      ),
    },
  ]

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-500 mt-1">Manage system users and their roles</p>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
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
          <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
          <p className="text-gray-500 mt-1">
            Manage system users and their roles
          </p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700"
        >
          <Plus className="w-5 h-5" />
          Create User
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search users by name or email..."
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Total Users</p>
          <p className="text-2xl font-bold text-gray-900">{users?.length || 0}</p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Active</p>
          <p className="text-2xl font-bold text-green-600">
            {users?.filter((u) => u.isActive).length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Site Managers</p>
          <p className="text-2xl font-bold text-blue-600">
            {users?.filter((u) => u.role === 'site_manager').length || 0}
          </p>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4">
          <p className="text-sm text-gray-600">Main Managers</p>
          <p className="text-2xl font-bold text-purple-600">
            {users?.filter((u) => u.role === 'main_manager').length || 0}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <DataTable
        columns={columns}
        data={filteredUsers}
        keyExtractor={(user) => user.id}
        searchable={false}
        emptyState={
          <div className="text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No users found</h3>
            <p className="text-gray-500 mt-1">
              {searchQuery
                ? 'Try adjusting your search'
                : 'Create your first user to get started'}
            </p>
          </div>
        }
      />

      {/* Modals */}
      <CreateUserModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        companyId="default-company"
      />
      <AssignSitesModal
        isOpen={!!assigningUser}
        onClose={() => setAssigningUser(null)}
        user={assigningUser}
      />
    </div>
  )
}
