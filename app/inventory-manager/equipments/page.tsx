"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
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
  models: {
    name: string;
    brand_code: string;
  }[];
}

const ITEMS_PER_PAGE = 10;

export default function EquipmentsPage() {
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }

      // Get total count
      const { count } = await supabase
        .from("assets")
        .select("*", { count: "exact", head: true })
        .eq("is_deleted", false);

      setTotalCount(count || 0);

      // Get paginated data
      const from = (currentPage - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

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
        .eq("is_deleted", false)
        .order("created_at", { ascending: false })
        .range(from, to);

      if (error) {
        setError(error.message);
      } else {
        setAssets(data || []);
      }
      setLoading(false);
    }
    fetchData();
  }, [supabase, currentPage]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "available":
        return "bg-[#00d26a]/10 text-[#00d26a]";
      case "assigned":
        return "bg-[#1769ff]/10 text-[#1769ff]";
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
      month: "short",
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

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

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
      <main className="max-w-6xl mx-auto px-6 py-12">
        {/* Breadcrumb and Title */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <Link href="/inventory-manager" className="hover:text-gray-900">
            Inventory Manager
          </Link>
          <span>/</span>
          <span className="text-gray-900">Equipments</span>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Equipments</h1>
            <p className="text-gray-500 mt-1">
              View and manage your inventory ({totalCount} total)
            </p>
          </div>
          <Link
            href="/inventory-manager/add"
            className="flex items-center gap-2 px-4 py-2 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Asset
          </Link>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-[#00d26a] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="border border-red-200 bg-red-50 rounded-lg p-4 text-red-600">
            Error loading equipment: {error}
          </div>
        )}

        {/* Assets Table */}
        {!loading && !error && assets.length > 0 && (
          <div className="border border-gray-100 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Asset Code
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Model
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Serial Number
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Supplier
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Purchase Date
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Price
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Condition
                    </th>
                    <th className="text-left text-xs font-medium text-gray-500 uppercase tracking-wider px-6 py-3">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {assets.map((asset) => (
                    <tr
                      key={asset.id}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <Link
                          href={`/inventory-manager/equipments/${asset.id}`}
                          className="text-sm font-medium text-[#1769ff] hover:underline"
                        >
                          {asset.asset_code}
                        </Link>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {asset.models && asset.models.length > 0
                          ? asset.models[0].name
                          : "-"}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 font-mono">
                        {asset.serial_number}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {asset.supplier_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatDate(asset.purchase_date)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {formatPrice(asset.purchase_price)}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`text-sm font-medium capitalize ${getConditionColor(asset.condition)}`}
                        >
                          {asset.condition?.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-medium rounded-full capitalize ${getStatusColor(asset.status)}`}
                        >
                          {asset.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && assets.length === 0 && (
          <div className="border border-gray-100 rounded-lg p-12 text-center">
            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-8 h-8 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">
              No assets found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first asset
            </p>
            <Link
              href="/inventory-manager/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#00d26a] text-white rounded-lg hover:bg-[#00b85c] transition-colors font-medium"
            >
              Add First Asset
            </Link>
          </div>
        )}

        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="flex items-center justify-between mt-6">
            <div className="text-sm text-gray-500">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of{" "}
              {totalCount} results
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                (page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`px-3 py-1.5 text-sm rounded-lg ${
                      page === currentPage
                        ? "bg-[#00d26a] text-white"
                        : "border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {page}
                  </button>
                ),
              )}
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
