import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Building2,
  MapPin,
  FileText,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  ArrowRight,
  TrendingUp,
  ChevronDown,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { sitesManagerApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import toast from "react-hot-toast";

type SortKey = "most-active" | "recent-activity" | "pending-price" | "name";

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "most-active", label: "Most Active" },
  { value: "recent-activity", label: "Recent Activity" },
  { value: "pending-price", label: "Pending Price" },
  { value: "name", label: "Name (A–Z)" },
];

interface SiteStats {
  totalRecords: number;
  pendingPriceCount: number;
  lastActivityDate: string | null;
}

// ── Confirmation dialog ──────────────────────────────────────────────────────

interface DeleteDialogProps {
  siteName: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}

function DeleteConfirmDialog({
  siteName,
  onConfirm,
  onCancel,
  isDeleting,
}: DeleteDialogProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        className="bg-card border border-border rounded-xl shadow-xl p-6 max-w-sm w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0">
            <AlertTriangle className="w-5 h-5 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete Site</h3>
            <p className="text-sm text-muted-foreground">
              This action cannot be undone
            </p>
          </div>
        </div>

        <p className="text-sm text-foreground mb-1">
          Are you sure you want to delete{" "}
          <span className="font-semibold">"{siteName}"</span>?
        </p>
        <p className="text-xs text-muted-foreground mb-6">
          All site records, assignments, and linked stock entries will be
          permanently removed.
        </p>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-lg border border-border text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="flex-1 px-4 py-2 rounded-lg bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Deleting…
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" /> Delete
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Site card ────────────────────────────────────────────────────────────────

interface SiteCardProps {
  site: {
    _id: string;
    name: string;
    location?: string;
    isActive: boolean;
  };
  stats: SiteStats;
  rank: number;
  onDelete: (site: { _id: string; name: string }) => void;
}

function SiteCard({ site, stats, rank, onDelete }: SiteCardProps) {
  const navigate = useNavigate();

  return (
    <div
      onClick={() => navigate(`/sites/${site._id}`)}
      className={cn(
        "bg-card rounded-xl border border-border p-6 shadow-sm cursor-pointer relative",
        "hover:shadow-md hover:border-primary transition-all duration-200",
      )}
    >
      {/* Rank badge for top 3 */}
      {rank <= 3 && (
        <span
          className={cn(
            "absolute top-3 right-14 text-[10px] font-bold px-2 py-0.5 rounded-full",
            rank === 1 &&
              "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400",
            rank === 2 &&
              "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
            rank === 3 &&
              "bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-400",
          )}
        >
          #{rank}
        </span>
      )}

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
        <div className="flex items-center gap-1">
          <span
            className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              site.isActive
                ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                : "bg-muted text-muted-foreground",
            )}
          >
            {site.isActive ? "Active" : "Inactive"}
          </span>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(site);
            }}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Delete site"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <FileText className="w-4 h-4" />
            Total Records
          </div>
          <p className="text-xl font-bold text-foreground">
            {stats.totalRecords ?? 0}
          </p>
        </div>
        <div className="p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
            <Clock className="w-4 h-4" />
            Pending Price
          </div>
          <p
            className={cn(
              "text-xl font-bold",
              stats.pendingPriceCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground",
            )}
          >
            {stats.pendingPriceCount}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          Last activity:{" "}
          {stats.lastActivityDate
            ? format.date(stats.lastActivityDate)
            : "No activity"}
        </div>
        <ArrowRight className="w-5 h-5 text-primary" />
      </div>
    </div>
  );
}

// ── Sort helper ──────────────────────────────────────────────────────────────

function sortSites(
  sitesWithStats: {
    site: { _id: string; name: string; location?: string; isActive: boolean };
    stats: SiteStats;
  }[],
  sortKey: SortKey,
) {
  return [...sitesWithStats].sort((a, b) => {
    switch (sortKey) {
      case "most-active": {
        const diff = b.stats.totalRecords - a.stats.totalRecords;
        if (diff !== 0) return diff;
        const dateA = a.stats.lastActivityDate
          ? new Date(a.stats.lastActivityDate).getTime()
          : 0;
        const dateB = b.stats.lastActivityDate
          ? new Date(b.stats.lastActivityDate).getTime()
          : 0;
        return dateB - dateA;
      }
      case "recent-activity": {
        const dateA = a.stats.lastActivityDate
          ? new Date(a.stats.lastActivityDate).getTime()
          : 0;
        const dateB = b.stats.lastActivityDate
          ? new Date(b.stats.lastActivityDate).getTime()
          : 0;
        return dateB - dateA;
      }
      case "pending-price":
        return b.stats.pendingPriceCount - a.stats.pendingPriceCount;
      case "name":
        return a.site.name.localeCompare(b.site.name);
      default:
        return 0;
    }
  });
}

// ── Main component ───────────────────────────────────────────────────────────

export function SitesOverview() {
  const queryClient = useQueryClient();
  const [sortKey, setSortKey] = useState<SortKey>("most-active");
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deletingTarget, setDeletingTarget] = useState<{
    _id: string;
    name: string;
  } | null>(null);

  const {
    data: sites,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["all-sites"],
    queryFn: sitesManagerApi.getAllSites,
  });

  const { data: sitesWithStats, isLoading: statsLoading } = useQuery({
    queryKey: ["sites-overview-stats"],
    queryFn: async () => {
      if (!sites) return [];
      const sitesData = await Promise.all(
        sites.map(async (site) => {
          try {
            const details = await sitesManagerApi.getSiteDetails(site._id);
            return {
              site,
              stats: {
                totalRecords: details.records?.length ?? 0,
                pendingPriceCount: details.stats.pendingPriceCount,
                lastActivityDate: details.stats.lastActivityDate,
              },
            };
          } catch {
            return {
              site,
              stats: {
                totalRecords: 0,
                pendingPriceCount: 0,
                lastActivityDate: null,
              },
            };
          }
        }),
      );
      return sitesData;
    },
    enabled: !!sites,
  });

  const deleteMutation = useMutation({
    mutationFn: (siteId: string) => sitesManagerApi.deleteSite(siteId),
    onSuccess: (_, siteId) => {
      toast.success("Site deleted successfully");
      // Immediately remove from both caches so the card disappears without waiting for a refetch
      queryClient.setQueryData<{ _id: string }[]>(
        ["all-sites"],
        (old) => old?.filter((s) => s._id !== siteId) ?? [],
      );
      queryClient.setQueryData<{ site: { _id: string } }[]>(
        ["sites-overview-stats"],
        (old) => old?.filter((item) => item.site._id !== siteId) ?? [],
      );
      setDeletingTarget(null);
    },
    onError: () => {
      toast.error("Failed to delete site");
      setDeletingTarget(null);
    },
  });

  const sorted = useMemo(
    () => (sitesWithStats ? sortSites(sitesWithStats, sortKey) : []),
    [sitesWithStats, sortKey],
  );

  const currentLabel = SORT_OPTIONS.find((o) => o.value === sortKey)?.label;

  if (isLoading || statsLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            Failed to load sites
          </h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            All Sites Overview
          </h1>
          <p className="text-muted-foreground mt-1">
            Click on a site to view details and manage records
          </p>
        </div>

        {/* Sort dropdown */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen((v) => !v)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-card",
              "text-sm font-medium text-foreground hover:border-primary transition-colors",
            )}
          >
            <TrendingUp className="w-4 h-4 text-primary" />
            Sort: {currentLabel}
            <ChevronDown
              className={cn(
                "w-4 h-4 transition-transform",
                dropdownOpen && "rotate-180",
              )}
            />
          </button>

          {dropdownOpen && (
            <div className="absolute right-0 mt-1 w-48 bg-card border border-border rounded-lg shadow-lg z-10 overflow-hidden">
              {SORT_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setSortKey(opt.value);
                    setDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-4 py-2.5 text-sm transition-colors",
                    sortKey === opt.value
                      ? "bg-primary/10 text-primary font-medium"
                      : "text-foreground hover:bg-muted",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sites Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {sorted.map(({ site, stats }, index) => (
          <SiteCard
            key={site._id}
            site={site}
            stats={stats}
            rank={index + 1}
            onDelete={setDeletingTarget}
          />
        ))}
      </div>

      {sorted.length === 0 && (
        <div className="text-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground">
            No sites yet
          </h3>
          <p className="text-muted-foreground mt-2">
            Create sites from the Sites Management page
          </p>
        </div>
      )}

      {/* Delete confirmation dialog */}
      {deletingTarget && (
        <DeleteConfirmDialog
          siteName={deletingTarget.name}
          onConfirm={() => deleteMutation.mutate(deletingTarget._id)}
          onCancel={() => setDeletingTarget(null)}
          isDeleting={deleteMutation.isPending}
        />
      )}
    </div>
  );
}
