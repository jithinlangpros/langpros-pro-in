"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";

interface Category {
  id: number;
  name: string;
  code: string;
}

interface Model {
  id: number;
  name: string;
  brand_code: string;
  category_id: number;
}

interface FormErrors {
  category_id?: string;
  models_id?: string;
  asset_code?: string;
  serial_number?: string;
  supplier_name?: string;
  invoice_number?: string;
  purchase_date?: string;
  purchase_price?: string;
  condition?: string;
  status?: string;
}

export default function AddInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const datePickerRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    category_id: "",
    models_id: "",
    asset_code: "",
    serial_number: "",
    supplier_name: "",
    invoice_number: "",
    purchase_date: "",
    purchase_price: "",
    description: "",
    condition: "good",
    status: "available",
  });

  // Fetch user, categories, and models
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }

      const [categoriesRes, modelsRes] = await Promise.all([
        supabase.from("categories").select("id, name, code").order("name"),
        supabase
          .from("models")
          .select("id, name, brand_code, category_id")
          .order("name"),
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (modelsRes.data) {
        setModels(modelsRes.data);
      }
    }
    fetchData();
  }, [supabase]);

  // Filter models when category changes
  useEffect(() => {
    if (formData.category_id) {
      const filtered = models.filter(
        (m) => m.category_id === parseInt(formData.category_id),
      );
      setFilteredModels(filtered);
    } else {
      setFilteredModels([]);
    }
  }, [formData.category_id, models]);

  // Close date picker when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        datePickerRef.current &&
        !datePickerRef.current.contains(event.target as Node)
      ) {
        setDatePickerOpen(false);
      }
    }

    if (datePickerOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [datePickerOpen]);

  // Generate asset code based on selected category and model
  const generateAssetCode = useCallback(
    async (categoryId: string, modelId: string) => {
      if (!categoryId || !modelId) {
        setFormData((prev) => ({ ...prev, asset_code: "" }));
        return;
      }

      const selectedCategory = categories.find(
        (c) => c.id === parseInt(categoryId),
      );
      const selectedModel = models.find((m) => m.id === parseInt(modelId));

      if (!selectedCategory || !selectedModel) {
        return;
      }

      const prefix = `${selectedCategory.code}-${selectedModel.brand_code}`;

      // Fetch last asset with this prefix
      const { data: lastAssetData } = await supabase
        .from("assets")
        .select("asset_code")
        .ilike("asset_code", `${prefix}%`)
        .order("asset_code", { ascending: false })
        .limit(1);

      const lastAsset =
        lastAssetData && lastAssetData.length > 0 ? lastAssetData[0] : null;

      let sequence = 1;
      if (lastAsset?.asset_code) {
        const lastSeq = lastAsset.asset_code.split("-").pop();
        if (lastSeq) {
          sequence = parseInt(lastSeq) + 1;
        }
      }

      const assetCode = `${prefix}-${sequence.toString().padStart(4, "0")}`;
      setFormData((prev) => ({ ...prev, asset_code: assetCode }));
    },
    [categories, models, supabase],
  );

  // Handle category change
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({
      ...prev,
      category_id: value,
      models_id: "",
      asset_code: "",
    }));
    setErrors((prev) => ({
      ...prev,
      category_id: undefined,
      models_id: undefined,
    }));
  };

  // Handle model change
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, models_id: value, asset_code: "" }));
    setErrors((prev) => ({ ...prev, models_id: undefined }));

    if (value && formData.category_id) {
      generateAssetCode(formData.category_id, value);
    }
  };

  // Handle other input changes
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }
    if (!formData.models_id) {
      newErrors.models_id = "Model is required";
    }
    if (!formData.asset_code) {
      newErrors.asset_code = "Asset code is required";
    }
    if (!formData.serial_number.trim()) {
      newErrors.serial_number = "Serial number is required";
    }
    if (!formData.supplier_name.trim()) {
      newErrors.supplier_name = "Supplier name is required";
    }
    if (!formData.invoice_number.trim()) {
      newErrors.invoice_number = "Invoice number is required";
    }
    if (!formData.purchase_date) {
      newErrors.purchase_date = "Purchase date is required";
    }
    if (!formData.purchase_price || parseFloat(formData.purchase_price) <= 0) {
      newErrors.purchase_price = "Valid purchase price is required";
    }
    if (!formData.condition) {
      newErrors.condition = "Condition is required";
    }
    if (!formData.status) {
      newErrors.status = "Status is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("assets").insert({
        models_id: parseInt(formData.models_id),
        asset_code: formData.asset_code,
        serial_number: formData.serial_number,
        supplier_name: formData.supplier_name,
        invoice_number: formData.invoice_number,
        purchase_date: formData.purchase_date,
        purchase_price: parseFloat(formData.purchase_price),
        description: formData.description,
        condition: formData.condition,
        status: formData.status,
        is_deleted: false,
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      router.push("/inventory-manager/equipments");
    } catch (err) {
      setServerError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
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
      <main className="max-w-2xl mx-auto px-6 py-12">
        {/* Breadcrumb and Title */}
        <div className="flex items-center gap-2 text-sm text-gray-500 mb-8">
          <Link href="/inventory-manager" className="hover:text-gray-900">
            Inventory Manager
          </Link>
          <span>/</span>
          <span className="text-gray-900">Add Item</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Asset</h1>
          <p className="text-gray-500 mt-1">
            Add a new asset to your inventory
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {serverError}
          </div>
        )}

        {/* Add Asset Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Category Selection */}
          <div>
            <label
              htmlFor="category_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleCategoryChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors bg-white ${
                errors.category_id ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name} ({category.code})
                </option>
              ))}
            </select>
            {errors.category_id && (
              <p className="mt-1 text-sm text-red-500">{errors.category_id}</p>
            )}
            <Link
              href="/inventory-manager/add/category"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[#1769ff] hover:underline"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add new category
            </Link>
          </div>

          {/* Model Selection */}
          <div>
            <label
              htmlFor="models_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Model / Brand *
            </label>
            <select
              id="models_id"
              name="models_id"
              value={formData.models_id}
              onChange={handleModelChange}
              disabled={!formData.category_id}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors bg-white ${
                !formData.category_id ? "bg-gray-100 cursor-not-allowed" : ""
              } ${errors.models_id ? "border-red-300" : "border-gray-200"}`}
            >
              <option value="">
                {formData.category_id
                  ? "Select model"
                  : "Select category first"}
              </option>
              {filteredModels.map((model) => (
                <option key={model.id} value={model.id}>
                  {model.name} ({model.brand_code})
                </option>
              ))}
            </select>
            {errors.models_id && (
              <p className="mt-1 text-sm text-red-500">{errors.models_id}</p>
            )}
            <Link
              href="/inventory-manager/add/model"
              className="mt-2 inline-flex items-center gap-1 text-sm text-[#1769ff] hover:underline"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              Add new model
            </Link>
          </div>

          {/* Asset Code (Auto-generated) */}
          <div>
            <label
              htmlFor="asset_code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Asset Code *
            </label>
            <input
              type="text"
              id="asset_code"
              name="asset_code"
              value={formData.asset_code}
              readOnly
              disabled
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors bg-gray-100 cursor-not-allowed ${
                errors.asset_code ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="Auto-generated after selecting category and model"
            />
            {errors.asset_code && (
              <p className="mt-1 text-sm text-red-500">{errors.asset_code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Format: [Category Code]-[Brand Code]-[Sequence] (e.g.,
              CCU-BSH-0001)
            </p>
          </div>

          {/* Serial Number */}
          <div>
            <label
              htmlFor="serial_number"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Serial Number *
            </label>
            <input
              type="text"
              id="serial_number"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors ${
                errors.serial_number ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="Enter serial number"
            />
            {errors.serial_number && (
              <p className="mt-1 text-sm text-red-500">
                {errors.serial_number}
              </p>
            )}
          </div>

          {/* Supplier Name & Invoice Number */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="supplier_name"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Supplier Name *
              </label>
              <input
                type="text"
                id="supplier_name"
                name="supplier_name"
                value={formData.supplier_name}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors ${
                  errors.supplier_name ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Enter supplier name"
              />
              {errors.supplier_name && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.supplier_name}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="invoice_number"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Invoice Number *
              </label>
              <input
                type="text"
                id="invoice_number"
                name="invoice_number"
                value={formData.invoice_number}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors ${
                  errors.invoice_number ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="Enter invoice number"
              />
              {errors.invoice_number && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.invoice_number}
                </p>
              )}
            </div>
          </div>

          {/* Purchase Date & Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="purchase_date"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Purchase Date *
              </label>
              <div className="relative" ref={datePickerRef}>
                <input
                  type="text"
                  id="purchase_date"
                  readOnly
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  value={
                    formData.purchase_date
                      ? format(new Date(formData.purchase_date), "PPP")
                      : ""
                  }
                  placeholder="Select purchase date"
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors cursor-pointer ${
                    errors.purchase_date ? "border-red-300" : "border-gray-200"
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setDatePickerOpen(!datePickerOpen)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
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
                      strokeWidth={1.5}
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </button>
                {datePickerOpen && (
                  <div className="absolute z-50 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-2">
                    <DayPicker
                      mode="single"
                      selected={
                        formData.purchase_date
                          ? new Date(formData.purchase_date)
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setFormData((prev) => ({
                            ...prev,
                            purchase_date: format(date, "yyyy-MM-dd"),
                          }));
                          setDatePickerOpen(false);
                          if (errors.purchase_date) {
                            setErrors((prev) => ({
                              ...prev,
                              purchase_date: undefined,
                            }));
                          }
                        }
                      }}
                      className="border-none"
                    />
                  </div>
                )}
              </div>
              {errors.purchase_date && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.purchase_date}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="purchase_price"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Purchase Price *
              </label>
              <input
                type="number"
                id="purchase_price"
                name="purchase_price"
                value={formData.purchase_price}
                onChange={handleChange}
                min="0"
                step="0.01"
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors ${
                  errors.purchase_price ? "border-red-300" : "border-gray-200"
                }`}
                placeholder="0.00"
              />
              {errors.purchase_price && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.purchase_price}
                </p>
              )}
            </div>
          </div>

          {/* Condition & Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                htmlFor="condition"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Condition *
              </label>
              <select
                id="condition"
                name="condition"
                value={formData.condition}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors bg-white ${
                  errors.condition ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="good">Good</option>
                <option value="damaged">Damaged</option>
                <option value="under_repair">Under Repair</option>
              </select>
              {errors.condition && (
                <p className="mt-1 text-sm text-red-500">{errors.condition}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="status"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Status *
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                disabled
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors bg-gray-100 cursor-not-allowed ${
                  errors.status ? "border-red-300" : "border-gray-200"
                }`}
              >
                <option value="available">Available</option>
              </select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-500">{errors.status}</p>
              )}
            </div>
          </div>

          {/* Description */}
          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Description
            </label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={4}
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#00d26a]/20 focus:border-[#00d26a] transition-colors resize-none"
              placeholder="Enter asset description (optional)"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
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
                  d="M5 13l4 4L19 7"
                />
              </svg>
              {isSubmitting ? "Adding..." : "Add Asset"}
            </button>
            <Link
              href="/inventory-manager"
              className="px-6 py-2.5 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
