import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  ClipboardList,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  Building2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
  Trash2,
  Copy,
  FileCheck,
  Ban,
  ArrowRightLeft,
} from "lucide-react";
import { quotationApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import type { Quotation } from "@/types";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const statusConfig: Record<
  string,
  { label: string; color: string; darkColor: string }
> = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700",
    darkColor: "dark:bg-gray-800 dark:text-gray-300",
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700",
    darkColor: "dark:bg-blue-900/30 dark:text-blue-400",
  },
  accepted: {
    label: "Accepted",
    color: "bg-green-100 text-green-700",
    darkColor: "dark:bg-green-900/30 dark:text-green-400",
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700",
    darkColor: "dark:bg-red-900/30 dark:text-red-400",
  },
  expired: {
    label: "Expired",
    color: "bg-amber-100 text-amber-700",
    darkColor: "dark:bg-amber-900/30 dark:text-amber-400",
  },
};

export function Quotations() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["quotations", page, searchQuery, statusFilter],
    queryFn: () =>
      quotationApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        supplier: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const deleteMutation = useMutation({
    mutationFn: quotationApi.delete,
    onSuccess: () => {
      toast.success("Quotation deleted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: () => toast.error("Failed to delete quotation"),
  });

  const sendMutation = useMutation({
    mutationFn: quotationApi.send,
    onSuccess: () => {
      toast.success("Quotation sent to supplier");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["client-quotations"] });
    },
    onError: () => toast.error("Failed to send quotation"),
  });

  const acceptMutation = useMutation({
    mutationFn: quotationApi.accept,
    onSuccess: () => {
      toast.success("Quotation accepted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: () => toast.error("Failed to accept quotation"),
  });

  const rejectMutation = useMutation({
    mutationFn: quotationApi.reject,
    onSuccess: () => {
      toast.success("Quotation rejected");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: () => toast.error("Failed to reject quotation"),
  });

  const duplicateMutation = useMutation({
    mutationFn: quotationApi.duplicate,
    onSuccess: () => {
      toast.success("Quotation duplicated");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
    },
    onError: () => toast.error("Failed to duplicate quotation"),
  });

  const convertMutation = useMutation({
    mutationFn: quotationApi.convertToPO,
    onSuccess: (data) => {
      toast.success(`Converted to PO ${data.convertedToPO.poNumber}`);
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      navigate(`/purchase-orders/${data.convertedToPO.id}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Failed to convert"),
  });

  const records: Quotation[] = data?.records || [];
  const totalPages = data?.totalPages || 1;

  if (isLoading) {
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
            Failed to load quotations
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
          <h1 className="text-2xl font-bold text-foreground">Quotations</h1>
          <p className="text-muted-foreground mt-1">
            Manage supplier quotations before raising purchase orders
          </p>
        </div>
        <button
          onClick={() => navigate("/quotations/new")}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Quotation
        </button>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              placeholder="Search by supplier..."
              className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="expired">Expired</option>
          </select>
          {(searchQuery || statusFilter !== "all") && (
            <button
              onClick={() => {
                setSearchQuery("");
                setStatusFilter("all");
                setPage(1);
              }}
              className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  QT #
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Supplier
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Site
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Items
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Total
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Valid Until
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">
                      No quotations found
                    </h3>
                    <p className="text-muted-foreground mt-1">
                      Create your first quotation to get started
                    </p>
                  </td>
                </tr>
              ) : (
                records.map((qt) => {
                  const cfg = statusConfig[qt.status] || statusConfig.draft;
                  return (
                    <tr
                      key={qt.id}
                      className="hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-4 py-3">
                        <button
                          onClick={() => navigate(`/quotations/${qt.id}`)}
                          className="font-mono text-sm font-medium text-primary hover:underline"
                        >
                          {qt.qtNumber}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {qt.supplier?.name || "-"}
                        </div>
                        {qt.supplier?.contactPerson && (
                          <div className="text-xs text-muted-foreground">
                            {qt.supplier.contactPerson}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {qt.site ? (
                          <div className="flex items-center gap-1">
                            <Building2 className="w-3 h-3" />
                            {qt.site.name}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {qt.items.length}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {format.currency(qt.totalAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {qt.validUntil ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {format.date(qt.validUntil)}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            "px-2 py-1 rounded-full text-xs font-medium",
                            cfg.color,
                            cfg.darkColor,
                          )}
                        >
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {/* View */}
                          <button
                            onClick={() => navigate(`/quotations/${qt.id}`)}
                            title="View"
                            className="p-1.5 rounded text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {/* Send (draft only) */}
                          {qt.status === "draft" && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Send this quotation to the supplier?",
                                  )
                                )
                                  sendMutation.mutate(qt.id);
                              }}
                              title="Send"
                              className="p-1.5 rounded text-muted-foreground hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                              <Send className="w-4 h-4" />
                            </button>
                          )}
                          {/* Accept (sent only) */}
                          {qt.status === "sent" && (
                            <button
                              onClick={() => {
                                if (confirm("Accept this quotation?"))
                                  acceptMutation.mutate(qt.id);
                              }}
                              title="Accept"
                              className="p-1.5 rounded text-muted-foreground hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors"
                            >
                              <FileCheck className="w-4 h-4" />
                            </button>
                          )}
                          {/* Reject (sent only) */}
                          {qt.status === "sent" && (
                            <button
                              onClick={() => {
                                if (confirm("Reject this quotation?"))
                                  rejectMutation.mutate(qt.id);
                              }}
                              title="Reject"
                              className="p-1.5 rounded text-muted-foreground hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                              <Ban className="w-4 h-4" />
                            </button>
                          )}
                          {/* Convert to PO (accepted, not yet converted) */}
                          {qt.status === "accepted" && !qt.convertedToPO && (
                            <button
                              onClick={() => {
                                if (
                                  confirm(
                                    "Convert this quotation to a Purchase Order?",
                                  )
                                )
                                  convertMutation.mutate(qt.id);
                              }}
                              title="Convert to PO"
                              className="p-1.5 rounded text-muted-foreground hover:text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition-colors"
                            >
                              <ArrowRightLeft className="w-4 h-4" />
                            </button>
                          )}
                          {/* Duplicate */}
                          <button
                            onClick={() => {
                              if (confirm("Duplicate this quotation?"))
                                duplicateMutation.mutate(qt.id);
                            }}
                            title="Duplicate"
                            className="p-1.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                          >
                            <Copy className="w-4 h-4" />
                          </button>
                          {/* Delete (draft only) */}
                          {qt.status === "draft" && (
                            <button
                              onClick={() => {
                                if (confirm("Delete this quotation?"))
                                  deleteMutation.mutate(qt.id);
                              }}
                              title="Delete"
                              className="p-1.5 rounded text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Page {page} of {totalPages} · {data?.total} total
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setPage(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
