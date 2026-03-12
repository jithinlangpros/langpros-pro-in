"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

interface Asset {
  id: number;
  asset_code: string;
  serial_number: string;
  supplier_name: string;
  invoice_number: string;
  purchase_date: string;
  purchase_price: number;
  description: string;
  condition: string;
  status: string;
  created_at: string;
  models_id: number;
  models:
    | {
        name: string;
        brand_code: string;
      }
    | {
        name: string;
        brand_code: string;
      }[];
}

export default function AssetDetailPage() {
  const params = useParams();
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [asset, setAsset] = useState<Asset | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    serial_number: "",
    supplier_name: "",
    invoice_number: "",
    purchase_date: "",
    purchase_price: 0,
    description: "",
    condition: "",
    status: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }

      const { data, error } = await supabase
        .from("assets")
        .select(
          `
          id,
          asset_code,
          serial_number,
          supplier_name,
          invoice_number,
          purchase_date,
          purchase_price,
          description,
          condition,
          status,
          created_at,
          models_id,
          models:models_id (
            name,
            brand_code
          )
        `,
        )
        .eq("id", params.id)
        .single();

      if (error) {
        setError(error.message);
      } else {
        console.log("Single Equipment:", data);
        setAsset(data);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase, params.id]);

  const handleEdit = () => {
    if (asset) {
      setEditForm({
        serial_number: asset.serial_number || "",
        supplier_name: asset.supplier_name || "",
        invoice_number: asset.invoice_number || "",
        purchase_date: asset.purchase_date || "",
        purchase_price: asset.purchase_price || 0,
        description: asset.description || "",
        condition: asset.condition || "",
        status: asset.status || "",
      });
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    if (!asset) return;
    setSaving(true);

    const { error } = await supabase
      .from("assets")
      .update({
        serial_number: editForm.serial_number,
        supplier_name: editForm.supplier_name,
        invoice_number: editForm.invoice_number,
        purchase_date: editForm.purchase_date,
        purchase_price: editForm.purchase_price,
        description: editForm.description,
        condition: editForm.condition,
        status: editForm.status,
      })
      .eq("id", asset.id);

    if (error) {
      setError(error.message);
    } else {
      // Refresh the asset data
      const { data } = await supabase
        .from("assets")
        .select(
          `
          id,
          asset_code,
          serial_number,
          supplier_name,
          invoice_number,
          purchase_date,
          purchase_price,
          description,
          condition,
          status,
          created_at,
          models_id,
          models:models_id (
            name,
            brand_code
          )
        `,
        )
        .eq("id", params.id)
        .single();

      setAsset(data);
      setIsEditing(false);
    }
    setSaving(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-[#1769ff]/10 text-[#1769ff]";
      case "assigned":
        return "bg-[#00d26a]/10 text-[#00d26a]";
      case "maintenance":
        return "bg-[#ffbd2e]/10 text-[#ffbd2e]";
      case "retired":
        return "bg-gray-100 text-gray-600";
      default:
        return "bg-gray-100 text-gray-600";
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case "new":
        return "text-[#1769ff]";
      case "good":
        return "text-[#00d26a]";
      case "damaged":
        return "text-red-500";
      case "under_repair":
        return "text-[#ffbd2e]";
      default:
        return "text-gray-600";
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatPrice = (price: number) => {
    if (!price) return "-";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-[#1769ff] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error || !asset) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Asset not found
          </h2>
          <p className="text-gray-500 mb-4">
            {error || "The asset you are looking for does not exist."}
          </p>
          <Link
            href="/inventory-manager/equipments"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium"
          >
            Back to Equipments
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-gray-900 tracking-wide">
              LANGRPROS
            </span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-sm text-gray-500">{userEmail}</span>
            <form action={signOut}>
              <button className="text-sm text-gray-600 hover:text-gray-900 px-4 py-2 rounded-lg hover:bg-gray-50 transition-colors">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-6 py-12">
        {/* Breadcrumb and Title */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/inventory-manager" className="hover:text-gray-900">
            Inventory Manager
          </Link>
          <span>/</span>
          <Link
            href="/inventory-manager/equipments"
            className="hover:text-gray-900"
          >
            Equipments
          </Link>
          <span>/</span>
          <span className="text-gray-900">{asset.asset_code}</span>
        </div>

        <div className="flex flex-col mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {asset.asset_code}
            </h1>
            <p className="text-gray-500 mt-1">
              {asset.models
                ? typeof asset.models === "object" && "name" in asset.models
                  ? `${(asset.models as { name: string; brand_code: string }).name} (${(asset.models as { name: string; brand_code: string }).brand_code})`
                  : Array.isArray(asset.models) && asset.models.length > 0
                    ? `${asset.models[0].name} (${asset.models[0].brand_code})`
                    : "Unknown Model"
                : "Unknown Model"}
            </p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span
                className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-full capitalize ${getStatusColor(asset.status)}`}
              >
                {asset.status}
              </span>
              <span
                className={`text-sm font-medium capitalize ${getConditionColor(asset.condition)}`}
              >
                {asset.condition?.replace("_", " ")}
              </span>
            </div>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="flex items-center gap-2 px-4 py-2 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                Edit
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-[#00d26a] text-white rounded-lg hover:bg-[#00b058] transition-colors font-medium disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium disabled:opacity-50"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Edit Form */}
        {isEditing ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="border border-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Basic Information
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Serial Number</label>
                  <input
                    type="text"
                    value={editForm.serial_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        serial_number: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Supplier Name</label>
                  <input
                    type="text"
                    value={editForm.supplier_name}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        supplier_name: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Invoice Number
                  </label>
                  <input
                    type="text"
                    value={editForm.invoice_number}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        invoice_number: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Purchase Date</label>
                  <input
                    type="date"
                    value={editForm.purchase_date}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        purchase_date: e.target.value,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Purchase Price
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.purchase_price}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        purchase_price: parseFloat(e.target.value) || 0,
                      })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
              </div>
            </div>
            <div className="border border-gray-100 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Edit Status & Details
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm({ ...editForm, description: e.target.value })
                    }
                    rows={3}
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  />
                </div>
                <div>
                  <label className="text-sm text-gray-500">Condition</label>
                  <select
                    value={editForm.condition}
                    onChange={(e) =>
                      setEditForm({ ...editForm, condition: e.target.value })
                    }
                    className="w-full mt-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
                  >
                    <option value="">Select condition</option>
                    <option value="new">New</option>
                    <option value="good">Good</option>
                    <option value="damaged">Damaged</option>
                    <option value="under_repair">Under Repair</option>
                  </select>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <div className="mt-1 px-3 py-2 bg-gray-100 border border-gray-200 rounded-lg text-gray-500 capitalize">
                    {editForm.status || "No status"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : null}

        {/* Asset Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <div className="border border-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Asset Code</p>
                <p className="text-gray-900 font-medium">{asset.asset_code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Serial Number</p>
                <p className="text-gray-900 font-mono">{asset.serial_number}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Model</p>
                <p className="text-gray-900">
                  {asset.models
                    ? typeof asset.models === "object" && "name" in asset.models
                      ? `${(asset.models as { name: string; brand_code: string }).name} (${(asset.models as { name: string; brand_code: string }).brand_code})`
                      : Array.isArray(asset.models) && asset.models.length > 0
                        ? `${asset.models[0].name} (${asset.models[0].brand_code})`
                        : "-"
                    : "-"}
                </p>
              </div>
            </div>
          </div>

          {/* Purchase Information */}
          <div className="border border-gray-100 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Purchase Information
            </h3>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500">Supplier</p>
                <p className="text-gray-900">{asset.supplier_name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Invoice Number</p>
                <p className="text-gray-900 font-mono">
                  {asset.invoice_number}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purchase Date</p>
                <p className="text-gray-900">
                  {formatDate(asset.purchase_date)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Purchase Price</p>
                <p className="text-gray-900 font-medium">
                  {formatPrice(asset.purchase_price)}
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          {asset.description && (
            <div className="border border-gray-100 rounded-lg p-6 md:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Description
              </h3>
              <p className="text-gray-600">{asset.description}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border border-gray-100 rounded-lg p-6 md:col-span-2">
            <div className="flex items-center justify-between text-sm text-gray-500">
              <p>Created: {formatDate(asset.created_at)}</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 mt-8">
          <Link
            href="/inventory-manager/equipments"
            className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            Back to Equipments
          </Link>
          <Link
            href="/inventory-manager/add"
            className="px-6 py-2.5 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium"
          >
            Add New Asset
          </Link>
        </div>
      </main>
    </div>
  );
}
