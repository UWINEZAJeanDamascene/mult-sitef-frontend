import { useQuery } from '@tanstack/react-query'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts'
import {
  DollarSign,
  Clock,
  Building2,
  FileText,
  Loader2,
  AlertCircle,
  TrendingUp,
  Package,
} from 'lucide-react'
import { dashboardApi } from '@/api/mainManager'
import { format } from '@/lib/utils'

function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  color,
  loading,
}: {
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  loading?: boolean
}) {
  return (
    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {loading ? (
            <div className="h-8 w-24 bg-muted animate-pulse rounded mt-2" />
          ) : (
            <h3 className="text-2xl font-bold text-foreground mt-2">{value}</h3>
          )}
          {subtitle && <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className={`p-3 rounded-lg ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  )
}

export function MainManagerDashboard() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['main-dashboard-stats'],
    queryFn: dashboardApi.getStats,
    refetchInterval: 60000, // 60 seconds
  })

  const { data: topMaterials, isLoading: materialsLoading } = useQuery({
    queryKey: ['top-materials'],
    queryFn: () => dashboardApi.getTopMaterials(10),
    refetchInterval: 60000,
  })

  const { data: movements, isLoading: movementsLoading } = useQuery({
    queryKey: ['stock-movements'],
    queryFn: () => dashboardApi.getStockMovements(30),
    refetchInterval: 60000,
  })

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Main Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of all sites and stock management
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Total Stock Value"
          value={statsLoading ? '' : format.currency(stats?.totalStockValue || 0)}
          subtitle="Sum of all priced records"
          icon={DollarSign}
          color="bg-green-600"
          loading={statsLoading}
        />
        <StatCard
          title="Pending Pricing"
          value={statsLoading ? '' : stats?.pendingPricingCount || 0}
          subtitle="Records awaiting price"
          icon={Clock}
          color="bg-amber-600"
          loading={statsLoading}
        />
        <StatCard
          title="Active Sites"
          value={statsLoading ? '' : stats?.activeSitesCount || 0}
          subtitle="Construction sites"
          icon={Building2}
          color="bg-blue-600"
          loading={statsLoading}
        />
        <StatCard
          title="Direct Records"
          value={statsLoading ? '' : stats?.directRecordsThisMonth || 0}
          subtitle="This month"
          icon={FileText}
          color="bg-purple-600"
          loading={statsLoading}
        />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Materials Bar Chart */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <Package className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Top 10 Materials by Quantity Received
            </h2>
          </div>
          
          {materialsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : topMaterials && topMaterials.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topMaterials} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                  <XAxis type="number" />
                  <YAxis 
                    dataKey="materialName" 
                    type="category" 
                    width={100}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    formatter={(value: number) => format.number(value, 2)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Bar 
                    dataKey="quantityReceived" 
                    fill="#4f46e5" 
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>No data available</p>
            </div>
          )}
        </div>

        {/* Stock Movements Line Chart */}
        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <TrendingUp className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">
              Stock Movements (Last 30 Days)
            </h2>
          </div>
          
          {movementsLoading ? (
            <div className="h-64 flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : movements && movements.length > 0 ? (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={movements}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={(date) => format.date(date)}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => format.number(value, 2)}
                    labelFormatter={(label) => format.date(label)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--popover))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      padding: '8px 12px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="received" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    dot={false}
                    name="Received"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="used" 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    dot={false}
                    name="Used"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-muted-foreground">
              <AlertCircle className="w-8 h-8 mb-2" />
              <p>No data available</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
