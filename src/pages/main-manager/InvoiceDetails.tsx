import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Receipt,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Clock,
  XCircle,
  Send,
  Printer,
  DollarSign,
  ExternalLink,
} from "lucide-react";
import { invoiceApi } from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import toast from "react-hot-toast";

const statusConfig = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-800", icon: Clock },
  sent: { label: "Sent", color: "bg-blue-100 text-blue-800", icon: Send },
  paid: { label: "Paid", color: "bg-green-100 text-green-800", icon: CheckCircle2 },
  overdue: { label: "Overdue", color: "bg-amber-100 text-amber-800", icon: Clock },
  cancelled: { label: "Cancelled", color: "bg-red-100 text-red-800", icon: XCircle },
};

export function InvoiceDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: invoice, isLoading, error } = useQuery({
    queryKey: ["invoice", id],
    queryFn: () => invoiceApi.getById(id!),
    enabled: !!id,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["invoice", id] });
    queryClient.invalidateQueries({ queryKey: ["invoices"] });
    queryClient.invalidateQueries({ queryKey: ["invoice-stats"] });
  };

  const sendMutation = useMutation({
    mutationFn: () => invoiceApi.send(id!),
    onSuccess: () => {
      toast.success("Invoice sent");
      invalidate();
    },
    onError: () => toast.error("Failed to send invoice"),
  });

  const payMutation = useMutation({
    mutationFn: () => invoiceApi.markPaid(id!),
    onSuccess: () => {
      toast.success("Invoice marked paid");
      invalidate();
    },
    onError: () => toast.error("Failed to mark invoice paid"),
  });

  const cancelMutation = useMutation({
    mutationFn: () => invoiceApi.cancel(id!),
    onSuccess: () => {
      toast.success("Invoice cancelled");
      invalidate();
    },
    onError: () => toast.error("Failed to cancel invoice"),
  });

  const openPdf = async () => {
    if (!id) return;
    const printWindow = window.open("about:blank", "_blank");
    if (!printWindow) {
      toast.error("Popup blocked. Allow popups and try again.");
      return;
    }

    try {
      const blob = await invoiceApi.exportToPDF(id);
      const url = window.URL.createObjectURL(blob);
      printWindow.location.href = url;
    } catch (err: any) {
      printWindow.close();
      toast.error(err?.response?.data?.error || "Failed to load invoice");
    }
  };

  if (isLoading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (error || !invoice) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">Invoice not found</h3>
          <button onClick={() => navigate("/invoices")} className="mt-3 text-primary hover:underline text-sm">
            Back to invoices
          </button>
        </div>
      </div>
    );
  }

  const statusInfo = statusConfig[invoice.status] || statusConfig.draft;
  const StatusIcon = statusInfo.icon;
  const isPending = sendMutation.isPending || payMutation.isPending || cancelMutation.isPending;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/invoices")} className="p-2 hover:bg-muted rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground font-mono">{invoice.invoiceNumber}</h1>
              <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium", statusInfo.color)}>
                <StatusIcon className="w-3 h-3" />
                {statusInfo.label}
              </span>
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Issued {format.date(invoice.issueDate)}
              {invoice.qtNumber && <> from <Link to={`/quotations/${invoice.quotation_id}`} className="text-primary hover:underline">{invoice.qtNumber}</Link></>}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button onClick={openPdf} className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted">
            <Printer className="w-4 h-4" />
            Print / PDF
          </button>
          {invoice.status === "draft" && (
            <button onClick={() => sendMutation.mutate()} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50">
              <Send className="w-4 h-4" />
              Send
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={() => payMutation.mutate()} disabled={isPending} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
              <DollarSign className="w-4 h-4" />
              Mark Paid
            </button>
          )}
          {invoice.status !== "paid" && invoice.status !== "cancelled" && (
            <button onClick={() => cancelMutation.mutate()} disabled={isPending} className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 disabled:opacity-50">
              <XCircle className="w-4 h-4" />
              Cancel
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Receipt className="w-5 h-5 text-primary" />
                Invoice Items
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Item</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Qty</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Unit Price</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoice.items.map((item) => (
                    <tr key={item._id || item.materialName}>
                      <td className="px-4 py-3">
                        <div className="font-medium text-foreground">{item.materialName}</div>
                        {item.description && <div className="text-sm text-muted-foreground">{item.description}</div>}
                      </td>
                      <td className="px-4 py-3 text-foreground">{format.number(item.quantity, 2)} {item.unit}</td>
                      <td className="px-4 py-3 text-foreground">{format.currency(item.unitPrice)}</td>
                      <td className="px-4 py-3 font-medium text-foreground">{format.currency(item.totalPrice)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {(invoice.notes || invoice.terms) && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
              {invoice.notes && <div><h3 className="text-sm font-semibold text-foreground mb-1">Notes</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.notes}</p></div>}
              {invoice.terms && <div><h3 className="text-sm font-semibold text-foreground mb-1">Terms</h3><p className="text-sm text-muted-foreground whitespace-pre-wrap">{invoice.terms}</p></div>}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-foreground">Summary</h2>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Subtotal</span><span>{format.currency(invoice.subTotal)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Tax ({invoice.taxRate}%)</span><span>{format.currency(invoice.taxAmount)}</span></div>
            <div className="flex justify-between text-sm"><span className="text-muted-foreground">Paid</span><span>{format.currency(invoice.amountPaid)}</span></div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Balance Due</span>
              <span className="font-bold text-lg text-foreground">{format.currency(invoice.balanceDue)}</span>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            <h2 className="font-semibold text-foreground mb-4">Client</h2>
            <div className="space-y-3 text-sm">
              <div className="font-medium text-foreground">{invoice.client.name}</div>
              {invoice.client.contactPerson && <div className="flex items-center gap-2 text-muted-foreground"><User className="w-4 h-4" />{invoice.client.contactPerson}</div>}
              {invoice.client.email && <div className="flex items-center gap-2 text-muted-foreground"><Mail className="w-4 h-4" />{invoice.client.email}</div>}
              {invoice.client.phone && <div className="flex items-center gap-2 text-muted-foreground"><Phone className="w-4 h-4" />{invoice.client.phone}</div>}
              {invoice.client.address && <div className="flex items-start gap-2 text-muted-foreground"><MapPin className="w-4 h-4 mt-0.5" />{invoice.client.address}</div>}
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-3 text-sm">
            <h2 className="font-semibold text-foreground">Dates</h2>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />Issued {format.date(invoice.issueDate)}</div>
            {invoice.dueDate && <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="w-4 h-4" />Due {format.date(invoice.dueDate)}</div>}
            {invoice.sentDate && <div className="flex items-center gap-2 text-muted-foreground"><Send className="w-4 h-4" />Sent {format.date(invoice.sentDate)}</div>}
            {invoice.paidDate && <div className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 className="w-4 h-4" />Paid {format.date(invoice.paidDate)}</div>}
            {invoice.quotation_id && (
              <Link to={`/quotations/${invoice.quotation_id}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                View quotation <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
