import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Loader2,
  Search,
  Building2,
} from "lucide-react";
import {
  quotationApi,
  sitesManagerApi,
  supplierApi,
  materialsCatalogApi,
} from "@/api/mainManager";
import { format, cn } from "@/lib/utils";
import toast from "react-hot-toast";
import type { CreateQuotationDto, QuotationItem } from "@/types";

interface ItemRow {
  materialName: string;
  material_id?: string;
  description: string;
  quantityRequested: number;
  unitPrice: number;
  totalPrice: number;
  unit: string;
  notes: string;
}

const emptyItem = (): ItemRow => ({
  materialName: "",
  material_id: undefined,
  description: "",
  quantityRequested: 1,
  unitPrice: 0,
  totalPrice: 0,
  unit: "pcs",
  notes: "",
});

export function QuotationForm() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const isEditing = !!id;

  // Form state
  const [supplierName, setSupplierName] = useState("");
  const [supplierContact, setSupplierContact] = useState("");
  const [supplierEmail, setSupplierEmail] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [supplierAddress, setSupplierAddress] = useState("");
  const [supplierSearch, setSupplierSearch] = useState("");
  const [showSupplierDropdown, setShowSupplierDropdown] = useState(false);
  const [siteId, setSiteId] = useState("");
  const [taxRate, setTaxRate] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<ItemRow[]>([emptyItem()]);
  const [materialSearch, setMaterialSearch] = useState<string[]>([""]);
  const [showMaterialDropdown, setShowMaterialDropdown] = useState<boolean[]>([
    false,
  ]);

  // Fetch existing quotation when editing
  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ["quotation", id],
    queryFn: () => quotationApi.getById(id!),
    enabled: isEditing,
  });

  // Load existing data into form
  useEffect(() => {
    if (existing) {
      setSupplierName(existing.supplier.name || "");
      setSupplierContact(existing.supplier.contactPerson || "");
      setSupplierEmail(existing.supplier.email || "");
      setSupplierPhone(existing.supplier.phone || "");
      setSupplierAddress(existing.supplier.address || "");
      setSiteId(existing.site?._id || "");
      setTaxRate(existing.taxRate || 0);
      setValidUntil(
        existing.validUntil ? existing.validUntil.split("T")[0] : "",
      );
      setNotes(existing.notes || "");
      setTerms(existing.terms || "");
      const loadedItems = existing.items.map((it) => ({
        materialName: it.materialName,
        material_id: it.material_id,
        description: it.description || "",
        quantityRequested: it.quantityRequested,
        unitPrice: it.unitPrice,
        totalPrice: it.totalPrice,
        unit: it.unit,
        notes: it.notes || "",
      }));
      setItems(loadedItems);
      setMaterialSearch(loadedItems.map((it) => it.materialName));
      setShowMaterialDropdown(loadedItems.map(() => false));
    }
  }, [existing]);

  // Fetch reference data
  const { data: suppliers } = useQuery({
    queryKey: ["suppliers"],
    queryFn: supplierApi.getAll,
  });
  const { data: sites } = useQuery({
    queryKey: ["all-sites"],
    queryFn: sitesManagerApi.getAllSites,
  });
  const { data: materials } = useQuery({
    queryKey: ["materials"],
    queryFn: materialsCatalogApi.getMaterials,
  });

  const filteredSuppliers =
    suppliers?.filter(
      (s) =>
        s.name.toLowerCase().includes(supplierSearch.toLowerCase()) &&
        s.isActive,
    ) || [];

  const createMutation = useMutation({
    mutationFn: quotationApi.create,
    onSuccess: (data) => {
      toast.success("Quotation created successfully");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      navigate(`/quotations/${data.id}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Failed to create quotation"),
  });

  const updateMutation = useMutation({
    mutationFn: ({
      id,
      dto,
    }: {
      id: string;
      dto: Partial<CreateQuotationDto>;
    }) => quotationApi.update(id, dto),
    onSuccess: () => {
      toast.success("Quotation updated successfully");
      queryClient.invalidateQueries({ queryKey: ["quotations"] });
      queryClient.invalidateQueries({ queryKey: ["quotation", id] });
      navigate(`/quotations/${id}`);
    },
    onError: (err: any) =>
      toast.error(err?.response?.data?.error || "Failed to update quotation"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  // Calculations
  const subTotal = items.reduce((s, it) => s + it.totalPrice, 0);
  const taxAmount = subTotal * (taxRate / 100);
  const totalAmount = subTotal + taxAmount;

  const updateItem = (index: number, field: keyof ItemRow, value: any) => {
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      const qty =
        field === "quantityRequested"
          ? Number(value)
          : next[index].quantityRequested;
      const price =
        field === "unitPrice" ? Number(value) : next[index].unitPrice;
      next[index].totalPrice = qty * price;
      return next;
    });
  };

  const addItem = () => {
    setItems((p) => [...p, emptyItem()]);
    setMaterialSearch((p) => [...p, ""]);
    setShowMaterialDropdown((p) => [...p, false]);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) return;
    setItems((p) => p.filter((_, i) => i !== index));
    setMaterialSearch((p) => p.filter((_, i) => i !== index));
    setShowMaterialDropdown((p) => p.filter((_, i) => i !== index));
  };

  const selectSupplier = (s: any) => {
    setSupplierName(s.name);
    setSupplierContact(s.contactPerson || "");
    setSupplierEmail(s.email || "");
    setSupplierPhone(s.phone || "");
    setSupplierAddress(s.address || "");
    setSupplierSearch("");
    setShowSupplierDropdown(false);
  };

  const selectMaterial = (index: number, mat: any) => {
    updateItem(index, "materialName", mat.name);
    updateItem(index, "material_id", mat._id);
    updateItem(index, "unit", mat.unit);
    setMaterialSearch((p) => {
      const n = [...p];
      n[index] = mat.name;
      return n;
    });
    setShowMaterialDropdown((p) => {
      const n = [...p];
      n[index] = false;
      return n;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierName.trim()) {
      toast.error("Supplier name is required");
      return;
    }
    if (items.some((it) => !it.materialName.trim())) {
      toast.error("All items must have a material name");
      return;
    }

    const dto: CreateQuotationDto = {
      supplier: {
        name: supplierName,
        contactPerson: supplierContact || undefined,
        email: supplierEmail || undefined,
        phone: supplierPhone || undefined,
        address: supplierAddress || undefined,
      },
      site_id: siteId || undefined,
      items: items.map((it) => ({
        materialName: it.materialName,
        material_id: it.material_id,
        description: it.description || undefined,
        quantityRequested: it.quantityRequested,
        unitPrice: it.unitPrice,
        unit: it.unit,
        notes: it.notes || undefined,
      })),
      taxRate,
      validUntil: validUntil || undefined,
      notes: notes || undefined,
      terms: terms || undefined,
    };

    if (isEditing) {
      updateMutation.mutate({ id: id!, dto });
    } else {
      createMutation.mutate(dto);
    }
  };

  if (isEditing && loadingExisting) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-muted rounded-lg transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {isEditing ? "Edit Quotation" : "New Quotation"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            {isEditing
              ? "Update quotation details"
              : "Create a quotation to send to a supplier"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Supplier */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground">Supplier Details</h2>

            {/* Supplier search from catalog */}
            <div className="relative">
              <label className="block text-sm font-medium text-foreground mb-1">
                Pick from catalog
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={supplierSearch}
                  onFocus={() => setShowSupplierDropdown(true)}
                  onChange={(e) => {
                    setSupplierSearch(e.target.value);
                    setShowSupplierDropdown(true);
                  }}
                  onBlur={() =>
                    setTimeout(() => setShowSupplierDropdown(false), 200)
                  }
                  placeholder="Search suppliers..."
                  className="w-full pl-10 pr-4 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              {showSupplierDropdown && filteredSuppliers.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto">
                  {filteredSuppliers.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onMouseDown={() => selectSupplier(s)}
                      className="w-full text-left px-4 py-2 hover:bg-muted text-sm text-foreground"
                    >
                      {s.name}
                      {s.contactPerson && (
                        <span className="text-muted-foreground ml-2">
                          · {s.contactPerson}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-foreground mb-1">
                  Supplier Name <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={supplierName}
                  onChange={(e) => setSupplierName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  value={supplierContact}
                  onChange={(e) => setSupplierContact(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={supplierEmail}
                  onChange={(e) => setSupplierEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Phone
                </label>
                <input
                  type="text"
                  value={supplierPhone}
                  onChange={(e) => setSupplierPhone(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Address
                </label>
                <input
                  type="text"
                  value={supplierAddress}
                  onChange={(e) => setSupplierAddress(e.target.value)}
                  className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                />
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-foreground">Items</h2>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1 px-3 py-1.5 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-foreground"
              >
                <Plus className="w-4 h-4" /> Add Item
              </button>
            </div>

            <div className="space-y-4">
              {items.map((item, index) => {
                const filteredMats =
                  materials?.filter(
                    (m) =>
                      m.isActive &&
                      m.name
                        .toLowerCase()
                        .includes((materialSearch[index] || "").toLowerCase()),
                  ) || [];

                return (
                  <div
                    key={index}
                    className="p-4 border border-border rounded-lg space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-muted-foreground">
                        Item {index + 1}
                      </span>
                      {items.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeItem(index)}
                          className="p-1 text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {/* Material name with autocomplete */}
                      <div className="sm:col-span-2 relative">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Material <span className="text-destructive">*</span>
                        </label>
                        <input
                          type="text"
                          value={materialSearch[index] || item.materialName}
                          onFocus={() =>
                            setShowMaterialDropdown((p) => {
                              const n = [...p];
                              n[index] = true;
                              return n;
                            })
                          }
                          onChange={(e) => {
                            const v = e.target.value;
                            setMaterialSearch((p) => {
                              const n = [...p];
                              n[index] = v;
                              return n;
                            });
                            updateItem(index, "materialName", v);
                            setShowMaterialDropdown((p) => {
                              const n = [...p];
                              n[index] = true;
                              return n;
                            });
                          }}
                          onBlur={() =>
                            setTimeout(
                              () =>
                                setShowMaterialDropdown((p) => {
                                  const n = [...p];
                                  n[index] = false;
                                  return n;
                                }),
                              200,
                            )
                          }
                          placeholder="Type or search material..."
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                        {showMaterialDropdown[index] &&
                          filteredMats.length > 0 && (
                            <div className="absolute z-10 w-full mt-1 bg-card border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto">
                              {filteredMats.slice(0, 8).map((m) => (
                                <button
                                  key={m._id}
                                  type="button"
                                  onMouseDown={() => selectMaterial(index, m)}
                                  className="w-full text-left px-3 py-2 hover:bg-muted text-sm text-foreground"
                                >
                                  {m.name}{" "}
                                  <span className="text-muted-foreground">
                                    ({m.unit})
                                  </span>
                                </button>
                              ))}
                            </div>
                          )}
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Quantity
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.quantityRequested}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "quantityRequested",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Unit
                        </label>
                        <input
                          type="text"
                          value={item.unit}
                          onChange={(e) =>
                            updateItem(index, "unit", e.target.value)
                          }
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Unit Price
                        </label>
                        <input
                          type="number"
                          min="0"
                          step="0.01"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(
                              index,
                              "unitPrice",
                              parseFloat(e.target.value) || 0,
                            )
                          }
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Total Price
                        </label>
                        <input
                          type="text"
                          value={format.currency(item.totalPrice)}
                          readOnly
                          className="w-full px-3 py-2 border border-input rounded-lg bg-muted text-foreground text-sm cursor-default"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-muted-foreground mb-1">
                          Description / Notes
                        </label>
                        <input
                          type="text"
                          value={item.notes}
                          onChange={(e) =>
                            updateItem(index, "notes", e.target.value)
                          }
                          placeholder="Optional description..."
                          className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes & Terms */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground">Notes & Terms</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
                placeholder="Additional notes..."
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Terms & Conditions
              </label>
              <textarea
                value={terms}
                onChange={(e) => setTerms(e.target.value)}
                rows={3}
                placeholder="Payment and delivery terms..."
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none"
              />
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Site & Meta */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-4">
            <h2 className="font-semibold text-foreground">Details</h2>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                <div className="flex items-center gap-1">
                  <Building2 className="w-4 h-4" /> Site (optional)
                </div>
              </label>
              <select
                value={siteId}
                onChange={(e) => setSiteId(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              >
                <option value="">No specific site</option>
                {sites?.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Valid Until
              </label>
              <input
                type="date"
                value={validUntil}
                onChange={(e) => setValidUntil(e.target.value)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Tax Rate (%)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 border border-input rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary text-sm"
              />
            </div>
          </div>

          {/* Summary */}
          <div className="bg-card rounded-xl border border-border p-6 shadow-sm space-y-3">
            <h2 className="font-semibold text-foreground">Summary</h2>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground font-medium">
                {format.currency(subTotal)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tax ({taxRate}%)</span>
              <span className="text-foreground font-medium">
                {format.currency(taxAmount)}
              </span>
            </div>
            <div className="border-t border-border pt-3 flex justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="font-bold text-lg text-foreground">
                {format.currency(totalAmount)}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              type="submit"
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium disabled:opacity-50"
            >
              {isPending && <Loader2 className="w-4 h-4 animate-spin" />}
              {isEditing ? "Save Changes" : "Create Quotation"}
            </button>
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="w-full px-4 py-2.5 border border-border rounded-lg hover:bg-muted transition-colors text-foreground font-medium"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </form>
  );
}
