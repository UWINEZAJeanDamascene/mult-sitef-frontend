import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  AlertCircle,
  ArrowLeft,
  Contact,
  CheckCircle2,
  Edit,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Hash,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { clientApi, quotationApi } from "@/api/mainManager";
import { cn, format } from "@/lib/utils";
import toast from "react-hot-toast";
import type { Client, CreateClientDto, Quotation } from "@/types";

interface EditFormProps {
  client: Client;
  onSubmit: (data: CreateClientDto) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

function EditForm({ client, onSubmit, onCancel, isSubmitting }: EditFormProps) {
  const [formData, setFormData] = useState<CreateClientDto>({
    name: client.name,
    contactPerson: client.contactPerson || "",
    email: client.email || "",
    phone: client.phone || "",
    address: client.address || "",
    taxId: client.taxId || "",
    notes: client.notes || "",
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Client name is required");
      return;
    }
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Client Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(event) =>
            setFormData({ ...formData, name: event.target.value })
          }
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Contact Person
        </label>
        <input
          type="text"
          value={formData.contactPerson}
          onChange={(event) =>
            setFormData({ ...formData, contactPerson: event.target.value })
          }
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(event) =>
              setFormData({ ...formData, email: event.target.value })
            }
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-foreground mb-1">
            Phone
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(event) =>
              setFormData({ ...formData, phone: event.target.value })
            }
            className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Tax ID
        </label>
        <input
          type="text"
          value={formData.taxId}
          onChange={(event) =>
            setFormData({ ...formData, taxId: event.target.value })
          }
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Address
        </label>
        <textarea
          value={formData.address}
          onChange={(event) =>
            setFormData({ ...formData, address: event.target.value })
          }
          rows={3}
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-foreground mb-1">
          Notes
        </label>
        <textarea
          value={formData.notes}
          onChange={(event) =>
            setFormData({ ...formData, notes: event.target.value })
          }
          rows={3}
          className="w-full px-4 py-2 border border-input rounded-lg focus:ring-2 focus:ring-primary bg-background text-foreground resize-none"
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-input text-foreground rounded-lg hover:bg-muted transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className={cn(
            "flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-lg",
            "hover:bg-primary/90 transition-colors",
            "flex items-center justify-center gap-2",
            "disabled:opacity-50 disabled:cursor-not-allowed",
          )}
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          Save Changes
        </button>
      </div>
    </form>
  );
}

export function ClientDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const {
    data: client,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client", id],
    queryFn: () => clientApi.getById(id!),
    enabled: !!id,
  });

  const {
    data: clientQuotations,
    isLoading: quotationsLoading,
  } = useQuery({
    queryKey: ["client-quotations", id],
    queryFn: () => quotationApi.getAll({ clientId: id! }),
    enabled: !!id,
  });

  const updateMutation = useMutation({
    mutationFn: (data: CreateClientDto) => clientApi.update(id!, data),
    onSuccess: () => {
      toast.success("Client updated successfully");
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-quotations", id] });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to update client");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => clientApi.delete(id!),
    onSuccess: () => {
      toast.success("Client deleted successfully");
      queryClient.invalidateQueries({ queryKey: ["clients"] });
      queryClient.invalidateQueries({ queryKey: ["client-quotations", id] });
      navigate("/clients");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete client");
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: (isActive: boolean) => clientApi.toggleActive(id!, isActive),
    onSuccess: () => {
      toast.success("Client status updated");
      queryClient.invalidateQueries({ queryKey: ["client", id] });
      queryClient.invalidateQueries({ queryKey: ["clients"] });
    },
    onError: (error: any) => {
      toast.error(
        error?.response?.data?.message || "Failed to update client status",
      );
    },
  });

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this client?")) {
      deleteMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !client) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
          <h3 className="text-lg font-medium text-foreground">
            Failed to load client
          </h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate("/clients")}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              {client.name}
            </h1>
            <div className="flex items-center gap-2 mt-1">
              <span
                className={cn(
                  "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  client.isActive
                    ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400"
                    : "bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400",
                )}
              >
                {client.isActive ? (
                  <>
                    <CheckCircle2 className="w-3 h-3" />
                    Active
                  </>
                ) : (
                  <>
                    <XCircle className="w-3 h-3" />
                    Inactive
                  </>
                )}
              </span>
              <span className="text-sm text-muted-foreground">
                Created {format.date(client.createdAt)}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => toggleActiveMutation.mutate(!client.isActive)}
            disabled={toggleActiveMutation.isPending}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors",
              client.isActive
                ? "border border-input hover:bg-muted text-foreground"
                : "bg-green-600 text-white hover:bg-green-700",
            )}
          >
            {client.isActive ? (
              <>
                <XCircle className="w-4 h-4" />
                Deactivate
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Activate
              </>
            )}
          </button>
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 border border-input rounded-lg hover:bg-muted transition-colors"
          >
            <Edit className="w-4 h-4" />
            Edit
          </button>
          <button
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 border border-destructive text-destructive rounded-lg hover:bg-destructive/10 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
            {isEditing ? (
              <EditForm
                client={client}
                onSubmit={(data) => updateMutation.mutate(data)}
                onCancel={() => setIsEditing(false)}
                isSubmitting={updateMutation.isPending}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center">
                    <Contact className="w-8 h-8 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      {client.name}
                    </h2>
                    <p className="text-sm text-muted-foreground">Client</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {client.contactPerson && (
                    <div className="flex items-start gap-3">
                      <User className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Contact Person
                        </p>
                        <p className="font-medium text-foreground">
                          {client.contactPerson}
                        </p>
                      </div>
                    </div>
                  )}

                  {client.email && (
                    <div className="flex items-start gap-3">
                      <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Email</p>
                        <a
                          href={`mailto:${client.email}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {client.email}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.phone && (
                    <div className="flex items-start gap-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <a
                          href={`tel:${client.phone}`}
                          className="font-medium text-foreground hover:text-primary"
                        >
                          {client.phone}
                        </a>
                      </div>
                    </div>
                  )}

                  {client.taxId && (
                    <div className="flex items-start gap-3">
                      <Hash className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Tax ID</p>
                        <p className="font-medium text-foreground">
                          {client.taxId}
                        </p>
                      </div>
                    </div>
                  )}

                  {client.address && (
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-muted-foreground mt-0.5" />
                      <div>
                        <p className="text-sm text-muted-foreground">Address</p>
                        <p className="font-medium text-foreground">
                          {client.address}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-4 border-t border-border">
                  <p className="text-sm text-muted-foreground">
                    Last updated: {format.date(client.updatedAt)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Open Documents</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {clientQuotations?.total ?? 0}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Total Value</p>
              <p className="text-2xl font-bold text-primary mt-1">
                {format.currency(
                  clientQuotations?.records.reduce(
                    (sum, quotation: Quotation) => sum + quotation.totalAmount,
                    0,
                  ) ?? 0,
                )}
              </p>
            </div>
            <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {client.isActive ? "Active" : "Inactive"}
              </p>
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-border">
              <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" />
                Client Documents
              </h2>
            </div>
            {quotationsLoading ? (
              <div className="px-6 py-10 text-center">
                <Loader2 className="w-12 h-12 text-primary mx-auto mb-3 animate-spin" />
                <p className="text-muted-foreground mt-1">Loading quotations...</p>
              </div>
            ) : clientQuotations?.records.length ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted">
                    <tr>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        QT #
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                        Total
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {clientQuotations.records.slice(0, 5).map((quotation) => (
                      <tr key={quotation.id} className="hover:bg-muted/50">
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/quotations/${quotation.id}`)}
                            className="font-mono text-sm font-medium text-primary hover:underline"
                          >
                            {quotation.qtNumber}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-sm text-muted-foreground">
                          {quotation.status}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-foreground">
                          {format.currency(quotation.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-6 py-10 text-center">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <h3 className="text-lg font-medium text-foreground">
                  No client documents yet
                </h3>
                <p className="text-muted-foreground mt-1">
                  Sales documents can connect here when that workflow is added.
                </p>
              </div>
            )}
          </div>

          {client.notes && (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-foreground mb-3">
                Notes
              </h2>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {client.notes}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
