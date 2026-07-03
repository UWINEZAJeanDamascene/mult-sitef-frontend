import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import {
  Receipt,
  Search,
  Loader2,
  AlertCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Eye,
  DollarSign,
} from "lucide-react";
import { invoiceApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import type { Invoice } from "@/types";
import toast from "react-hot-toast";

const ITEMS_PER_PAGE = 10;

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
  paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-amber-100 text-amber-800", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function Invoices() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, error } = useQuery({
    queryKey: ["invoices", page, searchQuery, statusFilter],
    queryFn: () =>
      invoiceApi.getAll({
        page,
        limit: ITEMS_PER_PAGE,
        client: searchQuery || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
      }),
  });

  const { data: stats } = useQuery({
    queryKey: ["invoice-stats"],
    queryFn: invoiceApi.getStats,
  });

  const sendMutation = useMutation({
    mutationFn: invoiceApi.send,
    onSuccess: () => {
      toast.success("Invoice sent");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
    },
    onError: () => toast.error("Failed to send invoice"),
  });

  const payMutation = useMutation({
    mutationFn: (id: string) => invoiceApi.markPaid(id),
    onSuccess: () => {
      toast.success("Invoice marked paid");
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
      queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
    },
    onError: () => toast.error("Failed to mark invoice paid"),
  });

  const records: Invoice[] = data?.records || [];
  const totalPages = data?.totalPages || 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Invoices</h1>
          <p className="text-muted-foreground mt-1">
            Track customer invoices created from accepted quotations
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Total Invoices</div>
          <div className="text-2xl font-bold text-foreground mt-1">{stats?.total || 0}</div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Invoice Value</div>
          <div className="text-2xl font-bold text-foreground mt-1">
            {format.currency(stats?.totalValue || 0)}
          </div>
        </div>
        <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
          <div className="text-muted-foreground text-sm">Outstanding</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            {format.currency(stats?.outstandingValue || 0)}
          </div>
        </div>
      </div>

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
              placeholder="Search by client..."
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
            <option value="paid">Paid</option>
            <option value="overdue">Overdue</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-muted">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Invoice</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Client</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Balance</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Due Date</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {isLoading ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" /></td></tr>
              ) : error ? (
                <tr><td colSpan={7} className="px-6 py-12 text-center"><AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />Failed to load invoices</td></tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <Receipt className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                    <h3 className="text-lg font-medium text-foreground">No invoices found</h3>
                  </td>
                </tr>
              ) : (
                records.map((invoice) => {
                  const statusInfo = statusConfig[invoice.status] || statusConfig.draft;
                  const StatusIcon = statusInfo.icon;
                  return (
                    <tr key={invoice.id} className="hover:bg-muted/50">
                      <td className="px-6 py-4">
                        <button
                          onClick={() => navigate(`/invoices/${invoice.id}`)}
                          className="font-mono font-medium text-primary hover:underline"
                        >
                          {invoice.invoiceNumber}
                        </button>
                        {invoice.qtNumber && <div className="text-xs text-muted-foreground">From {invoice.qtNumber}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-medium text-foreground">{invoice.client.name}</div>
                        {invoice.client.email && <div className="text-sm text-muted-foreground">{invoice.client.email}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", statusInfo.color)}>
                          <StatusIcon className="w-3 h-3" />
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-foreground">{format.currency(invoice.totalAmount)}</td>
                      <td className="px-6 py-4 font-medium text-foreground">{format.currency(invoice.balanceDue)}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {invoice.dueDate ? (
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {format.date(invoice.dueDate)}
                          </span>
                        ) : "-"}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1">
                          <button onClick={() => navigate(`/invoices/${invoice.id}`)} className="p-1.5 hover:bg-muted rounded-lg" title="View">
                            <Eye className="w-4 h-4 text-muted-foreground" />
                          </button>
                          {invoice.status === "draft" && (
                            <button onClick={() => sendMutation.mutate(invoice.id)} className="p-1.5 hover:bg-muted rounded-lg" title="Send">
                              <Send className="w-4 h-4 text-blue-500" />
                            </button>
                          )}
                          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
                            <button onClick={() => payMutation.mutate(invoice.id)} className="p-1.5 hover:bg-muted rounded-lg" title="Mark paid">
                              <DollarSign className="w-4 h-4 text-green-600" />
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

        {records.length > 0 && (
          <div className="px-6 py-4 border-t border-border flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Page {page} of {totalPages}</p>
            <div className="flex items-center gap-2">
              <button onClick={() => setPage(page - 1)} disabled={page === 1} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={() => setPage(page + 1)} disabled={page === totalPages} className="p-2 rounded-lg hover:bg-muted disabled:opacity-50">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
