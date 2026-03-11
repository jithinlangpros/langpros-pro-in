"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback, useRef, Fragment } from "react";
import { Listbox, Transition } from "@headlessui/react";
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

  // Generate asset code based on selected category and model
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
            <Listbox
              value={formData.category_id}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  category_id: String(value),
                  models_id: "",
                  asset_code: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  category_id: undefined,
                  models_id: undefined,
                }));
              }}
            >
              <div className="relative mt-1">
                <Listbox.Button
                  className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                    errors.category_id ? "border-red-300" : "border-gray-200"
                  }`}
                >
                  <span className="block truncate">
                    {categories.find(
                      (c) => c.id === parseInt(formData.category_id),
                    )
                      ? `${categories.find((c) => c.id === parseInt(formData.category_id))?.name} (${categories.find((c) => c.id === parseInt(formData.category_id))?.code})`
                      : "Select category"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-5 w- text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                    {categories.map((category) => (
                      <Listbox.Option
                        key={category.id}
                        value={category.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-[#1769ff]/10 text-[#1769ff]"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {category.name} ({category.code})
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
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
            <Listbox
              value={formData.models_id}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  models_id: String(value),
                  asset_code: "",
                }));
                setErrors((prev) => ({ ...prev, models_id: undefined }));

                if (value && formData.category_id) {
                  generateAssetCode(formData.category_id, String(value));
                }
              }}
              disabled={!formData.category_id}
            >
              <div className="relative mt-1">
                <Listbox.Button
                  className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                    !formData.category_id
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  } ${errors.models_id ? "border-red-300" : "border-gray-200"}`}
                >
                  <span
                    className={`block truncate ${!formData.category_id ? "text-gray-400" : ""}`}
                  >
                    {filteredModels.find(
                      (m) => m.id === parseInt(formData.models_id),
                    )
                      ? `${filteredModels.find((m) => m.id === parseInt(formData.models_id))?.name} (${filteredModels.find((m) => m.id === parseInt(formData.models_id))?.brand_code})`
                      : formData.category_id
                        ? "Select model"
                        : "Select category first"}
                  </span>
                  <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                    <svg
                      className="h-5 w-5 text-gray-400"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </Listbox.Button>
                <Transition
                  as={Fragment}
                  leave="transition ease-in duration-100"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                    {filteredModels.map((model) => (
                      <Listbox.Option
                        key={model.id}
                        value={model.id}
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-[#1769ff]/10 text-[#1769ff]"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${
                                selected ? "font-medium" : "font-normal"
                              }`}
                            >
                              {model.name} ({model.brand_code})
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    ))}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors bg-gray-100 cursor-not-allowed ${
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
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors ${
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
                  className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors cursor-pointer ${
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
                className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors ${
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
              <Listbox
                value={formData.condition}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, condition: value }));
                  setErrors((prev) => ({ ...prev, condition: undefined }));
                }}
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                      errors.condition ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <span className="block truncate">
                      {formData.condition === "good" && "Good"}
                      {formData.condition === "damaged" && "Damaged"}
                      {formData.condition === "under_repair" && "Under Repair"}
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </Listbox.Button>
                  <Transition
                    as={Fragment}
                    leave="transition ease-in duration-100"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                  >
                    <Listbox.Options className="absolute mt-1 max-h-60 w-full overflow-auto rounded-lg bg-white py-1 text-base shadow-lg ring-1 ring-black/5 focus:outline-none sm:text-sm z-50">
                      <Listbox.Option
                        value="good"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-[#1769ff]/10 text-[#1769ff]"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                            >
                              Good
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      <Listbox.Option
                        value="damaged"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-[#1769ff]/10 text-[#1769ff]"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                            >
                              Damaged
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                      <Listbox.Option
                        value="under_repair"
                        className={({ active }) =>
                          `relative cursor-pointer select-none py-2 pl-10 pr-4 ${
                            active
                              ? "bg-[#1769ff]/10 text-[#1769ff]"
                              : "text-gray-900"
                          }`
                        }
                      >
                        {({ selected }) => (
                          <>
                            <span
                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                            >
                              Under Repair
                            </span>
                            {selected && (
                              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-[#1769ff]">
                                <svg
                                  className="h-5 w-5"
                                  viewBox="0 0 20 20"
                                  fill="currentColor"
                                >
                                  <path
                                    fillRule="evenodd"
                                    d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
                                    clipRule="evenodd"
                                  />
                                </svg>
                              </span>
                            )}
                          </>
                        )}
                      </Listbox.Option>
                    </Listbox.Options>
                  </Transition>
                </div>
              </Listbox>
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
              <Listbox
                value={formData.status}
                onChange={(value) => {
                  setFormData((prev) => ({ ...prev, status: value }));
                  setErrors((prev) => ({ ...prev, status: undefined }));
                }}
                disabled
              >
                <div className="relative mt-1">
                  <Listbox.Button
                    className={`relative w-full cursor-not-allowed rounded-lg bg-gray-100 py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                      errors.status ? "border-red-300" : "border-gray-200"
                    }`}
                  >
                    <span className="block truncate text-gray-400">
                      Available
                    </span>
                    <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2">
                      <svg
                        className="h-5 w-5 text-gray-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 3a.75.75 0 01.55.24l3.25 3.5a.75.75 0 11-1.1 1.02L10 4.852 7.3 7.76a.75.75 0 01-1.1-1.02l3.25-3.5A.75.75 0 0110 3zm-3.76 9.2a.75.75 0 011.06.04l2.7 2.908 2.7-2.908a.75.75 0 111.1 1.02l-3.25 3.5a.75.75 0 01-1.1 0l-3.25-3.5a.75.75 0 01.04-1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </span>
                  </Listbox.Button>
                </div>
              </Listbox>
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
              className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors resize-none"
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
