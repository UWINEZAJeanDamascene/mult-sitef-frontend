import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  MapPin,
  FileText,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
} from 'lucide-react'
import { sitesManagerApi } from '@/api/mainManager'
import { format, cn } from '@/lib/utils'

interface SiteCardProps {
  site: {
    _id: string
    name: string
    location?: string
    isActive: boolean
  }
  stats: {
    recordsThisMonth: number
    pendingPriceCount: number
    lastActivityDate: string | null
  }
}

function SiteCard({ site, stats }: SiteCardProps) {
  const navigate = useNavigate()

  return (
    <div
      onClick={() => navigate(`/sites/${site._id}`)}
      className={cn(
        'bg-card rounded-xl border border-border p-6 shadow-sm cursor-pointer',
        'hover:shadow-md hover:border-primary transition-all duration-200'
      )}
    >
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{site.name}</h3>
            {site.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="w-3 h-3" />
                {site.location}
              </div>
            )}
          </div>
        </div>
        <span
          className={cn(
            'px-2 py-1 rounded-full text-xs font-medium',
            site.isActive
              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          {site.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            Records This Month
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.recordsThisMonth}
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            Pending Price
          </div>
          <p className={cn(
            'text-xl font-bold',
            stats.pendingPriceCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-foreground'
          )}>
            {stats.pendingPriceCount}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Last activity:{' '}
          {stats.lastActivityDate
            ? format.date(stats.lastActivityDate)
            : 'No activity'}
        </div>
        <ArrowRight className="w-5 h-5 text-primary" />
      </div>
    </div>
  )
}

export function SitesOverview() {
  const { data: sites, isLoading, error } = useQuery({
    queryKey: ['all-sites'],
    queryFn: sitesManagerApi.getAllSites,
  })

  // Fetch stats for each site
  const { data: sitesWithStats, isLoading: statsLoading } = useQuery({
    queryKey: ['sites-with-stats'],
    queryFn: async () => {
      if (!sites) return []
      const sitesData = await Promise.all(
        sites.map(async (site) => {
          try {
            const details = await sitesManagerApi.getSiteDetails(site._id)
            return {
              site,
              stats: details.stats,
            }
          } catch {
            return {
              site,
              stats: {
                recordsThisMonth: 0,
                pendingPriceCount: 0,
                lastActivityDate: null,
              },
            }
          }
        })
      )
      return sitesData
    },
    enabled: !!sites,
  })

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Failed to load sites</h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">All Sites Overview</h1>
          <p className="text-muted-foreground mt-1">
            Click on a site to view details and manage records
          </p>
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sitesWithStats?.map(({ site, stats }) => (
          <SiteCard key={site._id} site={site} stats={stats} />
        ))}
      </div>

      {sitesWithStats?.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground">No sites yet</h3>
          <p className="text-muted-foreground mt-2">
            Create sites from the Sites Management page
          </p>
        </div>
      )}
    </div>
  )
}
