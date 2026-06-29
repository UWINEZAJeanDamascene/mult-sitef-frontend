import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  Send,
  FileCheck,
  Ban,
  ArrowRightLeft,
  Edit,
  Trash2,
  Copy,
  ExternalLink,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Printer,
  Download,
} from "lucide-react";
import { quotationApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig: Record<
  string,
  { label: string; color: string; icon: React.ElementType }
> = {
  draft: {
    label: "Draft",
    color: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
    icon: Clock,
  },
  sent: {
    label: "Sent",
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
    icon: Send,
  },
  accepted: {
    label: "Accepted",
    color:
      "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
    icon: CheckCircle2,
  },
  rejected: {
    label: "Rejected",
    color: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    icon: XCircle,
  },
  expired: {
    label: "Expired",
    color:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
    icon: AlertTriangle,
  },
};

export function QuotationDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: qt,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationApi.getById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["quotation", id] });
    queryClient.invalidateQueries({ queryKey: ["quotations"] });
    if (qt?.client_id) {
      queryClient.invalidateQueries({ queryKey: ["client-quotations", qt.client_id] });
    }
  };

  const sendMutation = useMutation({
    mutationFn: () => quotationApi.send(id!),
    onSuccess: () => {
      toast.success("Quotation sent");
      invalidate();
    },
    onError: () => toast.error("Failed to send quotation"),
  });

  const acceptMutation = useMutation({
    mutationFn: () => quotationApi.accept(id!),
    onSuccess: () => {
      toast.success("Quotation accepted");
      invalidate();
    },
    onError: () => toast.error("Failed to accept quotation"),
  });

  const rejectMutation = useMutation({
    mutationFn: () => quotationApi.reject(id!),
    onSuccess: () => {
      toast.success("Quotation rejected");
      invalidate();
    },
    onError: () => toast.error("Failed to reject quotation"),
  });

  const convertMutation = useMutation({
    mutationFn: () => quotationApi.convertToPO(id!),
    onSuccess: (data) => {
      toast.success(`Converted to PO ${data.convertedToPO.poNumber}`);
      invalidate();
      navigate(`/purchase-orders/${data.convertedToPO.id}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Failed to convert to PO"),
  });

  const duplicateMutation = useMutation({
    mutationFn: () => quotationApi.duplicate(id!),
    onSuccess: (data: any) => {
      toast.success("Quotation duplicated");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      navigate(`/quotations/${data.id}`);
    },
    onError: () => toast.error("Failed to duplicate quotation"),
  });

  const deleteMutation = useMutation({
    mutationFn: () => quotationApi.delete(id!),
    onSuccess: () => {
      toast.success("Quotation deleted");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      navigate("/quotations");
    },
    onError: () => toast.error("Failed to delete quotation"),
  });

  const openQuotationPdfWindow = (download = false) => async () => {
    if (!id) {
      toast.error("Quotation ID is missing");
      return;
    }

    const printWindow = window.open("", "_blank", "noopener,noreferrer");
    if (!printWindow) {
      toast.error("Popup blocked. Allow popups and try again.");
      return;
    }

    try {
      const blob = await quotationApi.exportToPDF(id, download);
      const url = window.URL.createObjectURL(blob);
      printWindow.location.href = url;
    } catch (err: any) {
      printWindow.close();
      toast.error(err?.response?.data?.error || "Failed to load quotation PDF");
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !qt) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            Quotation not found
          </h3>
          <button
            onClick={() => navigate("/quotations")}
            className="mt-3 text-primary hover:underline text-sm"
          >
            Back to quotations
          </button>
        </div>
      </div>
    );
  }

  const cfg = statusConfig[qt.status] || statusConfig.draft;
  const StatusIcon = cfg.icon;
  const isAnyPending =
    sendMutation.isPending ||
    acceptMutation.isPending ||
    rejectMutation.isPending ||
    convertMutation.isPending ||
    duplicateMutation.isPending ||
    deleteMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/quotations")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground font-mono">
                {qt.qtNumber}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium",
                  cfg.color,
                )}
              >
                <StatusIcon className="w-3.5 h-3.5" />
                {cfg.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">
              Created {format.date(qt.createdAt)}
              {qt.createdBy && ` · by ${qt.createdBy}`}
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={openQuotationPdfWindow()}
            disabled={isAnyPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground disabled:opacity-50"
          >
            <Printer className="w-4 h-4" />
            Print
          </button>
          <button
            onClick={openQuotationPdfWindow(true)}
            disabled={isAnyPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>

          {/* Draft actions */}
          {qt.status === "draft" && (
            <>
              <button
                onClick={() => navigate(`/quotations/${id}/edit`)}
                className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
              <button
                onClick={() => {
                  if (confirm("Send this quotation to the supplier?"))
                    sendMutation.mutate();
                }}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {sendMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
                Send
              </button>
              <button
                onClick={() => {
                  if (confirm("Delete this quotation?"))
                    deleteMutation.mutate();
                }}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 py-2 border border-destructive text-destructive rounded-lg text-sm hover:bg-destructive/10 transition-colors disabled:opacity-50"
              >
                {deleteMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
                Delete
              </button>
            </>
          )}

          {/* Sent actions */}
          {qt.status === "sent" && (
            <>
              <button
                onClick={() => {
                  if (confirm("Accept this quotation?"))
                    acceptMutation.mutate();
                }}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {acceptMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FileCheck className="w-4 h-4" />
                )}
                Accept
              </button>
              <button
                onClick={() => {
                  if (confirm("Reject this quotation?"))
                    rejectMutation.mutate();
                }}
                disabled={isAnyPending}
                className="flex items-center gap-1.5 px-3 py-2 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {rejectMutation.isPending ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Ban className="w-4 h-4" />
                )}
                Reject
              </button>
            </>
          )}

          {/* Accepted actions */}
          {qt.status === "accepted" && !qt.convertedToPO && (
            <button
              onClick={() => {
                if (confirm("Convert this quotation to a Purchase Order?"))
                  convertMutation.mutate();
              }}
              disabled={isAnyPending}
              className="flex items-center gap-1.5 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              {convertMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <ArrowRightLeft className="w-4 h-4" />
              )}
              Convert to PO
            </button>
          )}

          {/* Converted PO link */}
          {qt.convertedToPO && (
            <Link
              to={`/purchase-orders/${qt.convertedToPO}`}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400 rounded-lg text-sm font-medium hover:opacity-80 transition-opacity"
            >
              <ExternalLink className="w-4 h-4" /> View PO
            </Link>
          )}

          {/* Duplicate (always available) */}
          <button
            onClick={() => {
              if (confirm("Duplicate this quotation?"))
                duplicateMutation.mutate();
            }}
            disabled={isAnyPending}
            className="flex items-center gap-1.5 px-3 py-2 border border-border rounded-lg text-sm hover:bg-muted transition-colors text-foreground disabled:opacity-50"
          >
            {duplicateMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            Duplicate
          </button>
        </div>
      </div>

      {/* Converted PO banner */}
      {qt.convertedToPO && (
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium text-sm">
              This quotation has been converted to a Purchase Order.
            </span>
          </div>
          <Link
            to={`/purchase-orders/${qt.convertedToPO}`}
            className="flex items-center gap-1 text-sm font-medium text-purple-700 dark:text-purple-400 hover:underline"
          >
            View PO <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: supplier + items */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Client</h2>
            <div className="space-y-2 text-sm">
              <p className="text-lg font-semibold text-foreground">
                {qt.client?.name || qt.supplier?.name}
              </p>
              {qt.client?.contactPerson ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" /> {qt.client.contactPerson}
                </div>
              ) : qt.supplier?.contactPerson ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <User className="w-4 h-4" /> {qt.supplier.contactPerson}
                </div>
              ) : null}
              {qt.client?.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" /> {qt.client.email}
                </div>
              ) : qt.supplier?.email ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" /> {qt.supplier.email}
                </div>
              ) : null}
              {qt.client?.phone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" /> {qt.client.phone}
                </div>
              ) : qt.supplier?.phone ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" /> {qt.supplier.phone}
                </div>
              ) : null}
              {qt.client?.address ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {qt.client.address}
                </div>
              ) : qt.supplier?.address ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" /> {qt.supplier.address}
                </div>
              ) : null}
            </div>
          </div>

          {/* Items Table */}
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground">
                Items ({qt.items.length})
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Material
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Qty
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Unit
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Unit Price
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {qt.items.map((item, i) => (
                    <tr key={i} className="hover:bg-muted/50">
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">
                          {item.materialName}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {item.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {format.number(item.quantityRequested, 2)}
                      </td>
                      <td className="px-4 py-3 text-sm text-muted-foreground">
                        {item.unit}
                      </td>
                      <td className="px-4 py-3 text-sm text-foreground">
                        {format.currency(item.unitPrice)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-foreground">
                        {format.currency(item.totalPrice)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes & Terms */}
          {(qt.notes || qt.terms) && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
              {qt.notes && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Notes
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {qt.notes}
                  </p>
                </div>
              )}
              {qt.terms && (
                <div>
                  <h3 className="text-sm font-semibold text-foreground mb-1">
                    Terms & Conditions
                  </h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {qt.terms}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: summary + meta */}
        <div className="space-y-6">
          {/* Financial summary */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-foreground">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                {format.currency(qt.subTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({qt.taxRate}%)</span>
              <span className="font-medium text-foreground">
                {format.currency(qt.taxAmount)}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-foreground">
                {format.currency(qt.totalAmount)}
              </span>
            </div>
          </div>

          {/* Meta */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-3 text-sm">
            <h2 className="font-semibold text-foreground">Details</h2>
            {qt.site && (
              <div className="flex items-start gap-2">
                <Building2 className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Site</p>
                  <p className="font-medium text-foreground">{qt.site.name}</p>
                  {qt.site.location && (
                    <p className="text-xs text-muted-foreground">
                      {qt.site.location}
                    </p>
                  )}
                </div>
              </div>
            )}
            {qt.validUntil && (
              <div className="flex items-start gap-2">
                <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Valid Until</p>
                  <p className="font-medium text-foreground">
                    {format.date(qt.validUntil)}
                  </p>
                </div>
              </div>
            )}
            {qt.sentDate && (
              <div className="flex items-start gap-2">
                <Send className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  <p className="text-xs text-muted-foreground">Sent Date</p>
                  <p className="font-medium text-foreground">
                    {format.date(qt.sentDate)}
                  </p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-xs text-muted-foreground">Created</p>
                <p className="font-medium text-foreground">
                  {format.date(qt.createdAt)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
