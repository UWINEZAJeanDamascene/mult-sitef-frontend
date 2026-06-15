import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Building2,
  MapPin,
  ArrowLeft,
  FileText,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  Package,
  TrendingDown,
  User,
  ArrowUpRight,
  Edit2,
  X,
} from "lucide-react";
import { sitesManagerApi, mainStockApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import toast from "react-hot-toast";

function InlinePriceEdit({
  recordId,
  currentPrice,
  onSave,
  isPending,
}: {
  recordId: string;
  currentPrice?: number | null;
  onSave: (id: string, price: number) => void;
  isPending: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [price, setPrice] = useState(currentPrice?.toString() || "");

  const handleSave = () => {
    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      toast.error("Please enter a valid price");
      return;
    }
    onSave(recordId, numPrice);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          className="w-24 px-2 py-1 text-sm border border-input rounded bg-background"
          autoFocus
          step="0.01"
        />
        <button
          onClick={handleSave}
          disabled={isPending}
          className="p-1 text-green-600 dark:text-green-400 hover:bg-green-500/10 rounded"
        >
          {isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "✓"}
        </button>
        <button
          onClick={() => {
            setIsEditing(false);
            setPrice(currentPrice?.toString() || "");
          }}
          className="p-1 text-red-600 dark:text-red-400 hover:bg-red-500/10 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setIsEditing(true)}
      className="flex items-center gap-1 text-sm text-primary hover:text-primary/80"
    >
      {currentPrice ? format.currency(currentPrice) : "Set price"}
      <Edit2 className="w-3 h-3" />
    </button>
  );
}

export function SiteDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"received" | "used">("received");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const queryClient = useQueryClient();

  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      mainStockApi.updatePrice(id, price),
    onSuccess: () => {
      toast.success("Price updated successfully");
      queryClient.invalidateQueries({ queryKey: ["site-details", id] });
    },
    onError: () => {
      toast.error("Failed to update price");
    },
  });

  const handlePriceUpdate = (mainStockId: string, price: number) => {
    updatePriceMutation.mutate({ id: mainStockId, price });
  };

  const { data, isLoading, error } = useQuery({
    queryKey: ["site-details", id, startDate, endDate],
    queryFn: () =>
      sitesManagerApi.getSiteDetails(id!, {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
      }),
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            Failed to load site details
          </h3>
          <p className="text-muted-foreground mt-1">Please try again later</p>
        </div>
      </div>
    );
  }

  const { site, records, stats } = data;

  const receivedRecords = records.filter((r) => r.quantityReceived > 0);
  const usedRecords = records.filter((r) => r.quantityUsed > 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate("/sites")}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{site.name}</h1>
          {site.location && (
            <div className="flex items-center gap-1 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              {site.location}
            </div>
          )}
        </div>
        <span
          className={cn(
            "ml-auto px-3 py-1 rounded-full text-sm font-medium",
            site.isActive
              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
              : "bg-muted text-muted-foreground",
          )}
        >
          {site.isActive ? "Active" : "Inactive"}
        </span>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <FileText className="w-4 h-4" />
            Total Records
          </div>
          <p className="text-2xl font-bold text-foreground">{records.length}</p>
          <p className="text-xs text-muted-foreground mt-1">
            This month: {stats.recordsThisMonth}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Clock className="w-4 h-4" />
            Pending Price
          </div>
          <p
            className={cn(
              "text-2xl font-bold",
              stats.pendingPriceCount > 0
                ? "text-amber-600 dark:text-amber-400"
                : "text-foreground",
            )}
          >
            {stats.pendingPriceCount}
          </p>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="flex items-center gap-2 text-muted-foreground mb-2">
            <Calendar className="w-4 h-4" />
            Last Activity
          </div>
          <p className="text-2xl font-bold text-foreground">
            {stats.lastActivityDate
              ? format.date(stats.lastActivityDate)
              : "No activity"}
          </p>
        </div>
      </div>

      {/* Date filter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-muted-foreground font-medium">
          Filter by date:
        </span>
        <input
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Start date"
        />
        <span className="text-muted-foreground text-sm">to</span>
        <input
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
          className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="End date"
        />
        {(startDate || endDate) && (
          <button
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            className="px-3 py-1.5 text-sm rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setActiveTab("received")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "received"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <Package className="w-4 h-4" />
          Received ({receivedRecords.length})
        </button>
        <button
          onClick={() => setActiveTab("used")}
          className={cn(
            "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors",
            activeTab === "used"
              ? "text-primary border-b-2 border-primary"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          <TrendingDown className="w-4 h-4" />
          Used ({usedRecords.length})
        </button>
      </div>

      {/* Records Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  {activeTab === "received"
                    ? "Quantity Received"
                    : "Quantity Used"}
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Notes
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Recorded By
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {(activeTab === "received" ? receivedRecords : usedRecords)
                .length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center">
                    <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">
                      No records found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      No {activeTab} materials recorded yet
                    </p>
                  </td>
                </tr>
              ) : (
                (activeTab === "received" ? receivedRecords : usedRecords).map(
                  (record) => (
                    <tr key={record._id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">
                          {record.materialName}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {format.number(
                          activeTab === "received"
                            ? record.quantityReceived
                            : record.quantityUsed,
                          2,
                        )}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {format.date(record.date)}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground max-w-xs truncate">
                        {record.notes || "-"}
                      </td>
                      <td className="px-6 py-4">
                        {activeTab === "received" &&
                        record.mainStockEntryId &&
                        (record as any).status === "pending_price" ? (
                          <InlinePriceEdit
                            recordId={record.mainStockEntryId}
                            currentPrice={(record as any).price}
                            onSave={handlePriceUpdate}
                            isPending={updatePriceMutation.isPending}
                          />
                        ) : (
                          <span className="text-sm text-foreground">
                            {(record as any).price
                              ? format.currency((record as any).price)
                              : "-"}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-foreground">
                        {(record as any).totalValue
                          ? format.currency((record as any).totalValue)
                          : "-"}
                      </td>
                      <td className="px-6 py-4">
                        {(record as any).status ? (
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
                              (record as any).status === "pending_price" &&
                                "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
                              (record as any).status === "priced" &&
                                "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
                            )}
                          >
                            {(record as any).status === "pending_price" ? (
                              <>
                                <Clock className="w-3 h-3" /> Pending
                              </>
                            ) : (
                              <>
                                <ArrowUpRight className="w-3 h-3" /> Priced
                              </>
                            )}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground">
                            -
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-foreground">
                        {record.recordedByName || record.recordedBy}
                      </td>
                    </tr>
                  ),
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
