"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { Fragment } from "react";
import Button from "@/components/Button";

interface Category {
  id: string;
  name: string;
  code: string;
}

interface Subcategory {
  id: string;
  name: string;
  code: string;
  category_id: string;
}

interface Model {
  id: string;
  name: string;
  brand: string;
  code: string;
  subcategory_id: string;
}

interface FormErrors {
  category_id?: string;
  subcategory_id?: string;
  model_id?: string;
  sku?: string;
  serial_number?: string;
  location?: string;
  sub_location?: string;
  purchase_date?: string;
  warranty_expiry?: string;
  last_maintenance?: string;
  next_maintenance?: string;
  condition?: string;
  status?: string;
}

export default function AddInventoryPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [models, setModels] = useState<Model[]>([]);
  const [filteredSubcategories, setFilteredSubcategories] = useState<
    Subcategory[]
  >([]);
  const [filteredModels, setFilteredModels] = useState<Model[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const [formData, setFormData] = useState({
    category_id: "",
    subcategory_id: "",
    model_id: "",
    sku: "",
    serial_number: "",
    location: "",
    sub_location: "",
    purchase_date: "",
    warranty_expiry: "",
    last_maintenance: "",
    next_maintenance: "",
    notes: "",
    condition: "excellent",
    status: "available",
  });

  // Fetch categories, subcategories, and models
  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }

      const [categoriesRes, subcategoriesRes, modelsRes] = await Promise.all([
        supabase.from("categories").select("id, name, code").order("name"),
        supabase
          .from("subcategories")
          .select("id, name, code, category_id")
          .order("name"),
        supabase
          .from("models")
          .select("id, name, brand, code, subcategory_id")
          .order("name"),
      ]);

      if (categoriesRes.data) {
        setCategories(categoriesRes.data);
      }
      if (subcategoriesRes.data) {
        setSubcategories(subcategoriesRes.data);
      }
      if (modelsRes.data) {
        setModels(modelsRes.data);
      }
    }
    fetchData();
  }, [supabase]);

  // Filter subcategories when category changes
  useEffect(() => {
    if (formData.category_id) {
      const filtered = subcategories.filter(
        (s) => s.category_id === formData.category_id,
      );
      setFilteredSubcategories(filtered);
      setFilteredModels([]);
      setFormData((prev) => ({
        ...prev,
        subcategory_id: "",
        model_id: "",
        sku: "",
      }));
    } else {
      setFilteredSubcategories([]);
      setFilteredModels([]);
    }
  }, [formData.category_id, subcategories]);

  // Filter models when subcategory changes
  useEffect(() => {
    if (formData.subcategory_id) {
      const filtered = models.filter(
        (m) => m.subcategory_id === formData.subcategory_id,
      );
      setFilteredModels(filtered);
      setFormData((prev) => ({
        ...prev,
        model_id: "",
        sku: "",
      }));
    } else {
      setFilteredModels([]);
    }
  }, [formData.subcategory_id, models]);

  // Auto-generate SKU when model is selected
  useEffect(() => {
    async function generateSku() {
      if (
        !formData.category_id ||
        !formData.subcategory_id ||
        !formData.model_id
      ) {
        return;
      }

      const selectedCategory = categories.find(
        (c) => c.id === formData.category_id,
      );
      const selectedSubcategory = subcategories.find(
        (s) => s.id === formData.subcategory_id,
      );
      const selectedModel = models.find((m) => m.id === formData.model_id);

      if (!selectedCategory || !selectedSubcategory || !selectedModel) {
        return;
      }

      // SKU format: CATEGORY-SUBCATEGORY-MODEL-SEQUENCE
      // Example: AUD-SPK-QSC-0001
      const prefix = `${selectedCategory.code}-${selectedSubcategory.code}-${selectedModel.code}`;

      // Fetch last asset with this prefix
      const { data: lastAssetData } = await supabase
        .from("assets")
        .select("sku")
        .ilike("sku", `${prefix}%`)
        .order("sku", { ascending: false })
        .limit(1);

      let sequence = 1;
      if (lastAssetData && lastAssetData.length > 0 && lastAssetData[0].sku) {
        const lastSku = lastAssetData[0].sku;
        const parts = lastSku.split("-");
        const lastSeq = parts[parts.length - 1];
        if (lastSeq) {
          sequence = parseInt(lastSeq) + 1;
        }
      }

      const sku = `${prefix}-${sequence.toString().padStart(4, "0")}`;
      setFormData((prev) => ({ ...prev, sku }));
    }

    generateSku();
  }, [
    formData.category_id,
    formData.subcategory_id,
    formData.model_id,
    categories,
    subcategories,
    models,
    supabase,
  ]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.category_id) {
      newErrors.category_id = "Category is required";
    }
    if (!formData.subcategory_id) {
      newErrors.subcategory_id = "Subcategory is required";
    }
    if (!formData.model_id) {
      newErrors.model_id = "Model is required";
    }
    if (!formData.sku) {
      newErrors.sku = "SKU is required";
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from("assets").insert({
        model_id: formData.model_id,
        sku: formData.sku,
        serial_number: formData.serial_number || null,
        location: formData.location || null,
        sub_location: formData.sub_location || null,
        purchase_date: formData.purchase_date || null,
        warranty_expiry: formData.warranty_expiry || null,
        last_maintenance: formData.last_maintenance || null,
        next_maintenance: formData.next_maintenance || null,
        notes: formData.notes || null,
        condition: formData.condition,
        status: formData.status,
        is_active: true,
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
              <Button variant="secondary" type="submit">
                Sign out
              </Button>
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
          <span className="text-gray-900">Add Asset</span>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category *
            </label>
            <Listbox
              value={formData.category_id}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  category_id: String(value),
                  subcategory_id: "",
                  model_id: "",
                  sku: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  category_id: undefined,
                  subcategory_id: undefined,
                  model_id: undefined,
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
                    {categories.find((c) => c.id === formData.category_id)
                      ? `${categories.find((c) => c.id === formData.category_id)?.name} (${categories.find((c) => c.id === formData.category_id)?.code})`
                      : "Select category"}
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
                              className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
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

          {/* Subcategory Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subcategory *
            </label>
            <Listbox
              value={formData.subcategory_id}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  subcategory_id: String(value),
                  model_id: "",
                  sku: "",
                }));
                setErrors((prev) => ({
                  ...prev,
                  subcategory_id: undefined,
                  model_id: undefined,
                }));
              }}
              disabled={!formData.category_id}
            >
              <div className="relative mt-1">
                <Listbox.Button
                  className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                    !formData.category_id
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  } ${errors.subcategory_id ? "border-red-300" : "border-gray-200"}`}
                >
                  <span
                    className={`block truncate ${!formData.category_id ? "text-gray-400" : ""}`}
                  >
                    {filteredSubcategories.find(
                      (s) => s.id === formData.subcategory_id,
                    )
                      ? `${filteredSubcategories.find((s) => s.id === formData.subcategory_id)?.name} (${filteredSubcategories.find((s) => s.id === formData.subcategory_id)?.code})`
                      : formData.category_id
                        ? "Select subcategory"
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
                    {filteredSubcategories.length === 0 ? (
                      <div className="py-2 pl-4 pr-4 text-gray-500 text-sm">
                        No subcategory available
                      </div>
                    ) : (
                      filteredSubcategories.map((subcategory) => (
                        <Listbox.Option
                          key={subcategory.id}
                          value={subcategory.id}
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
                                {subcategory.name} ({subcategory.code})
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
                      ))
                    )}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
            {errors.subcategory_id && (
              <p className="mt-1 text-sm text-red-500">
                {errors.subcategory_id}
              </p>
            )}
            <Link
              href="/inventory-manager/add/subcategory"
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
              Add new subcategory
            </Link>
          </div>

          {/* Model Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Model *
            </label>
            <Listbox
              value={formData.model_id}
              onChange={(value) => {
                setFormData((prev) => ({
                  ...prev,
                  model_id: String(value),
                }));
                setErrors((prev) => ({
                  ...prev,
                  model_id: undefined,
                }));
              }}
              disabled={!formData.subcategory_id}
            >
              <div className="relative mt-1">
                <Listbox.Button
                  className={`relative w-full cursor-pointer rounded-lg bg-white py-2 pl-3 pr-10 text-left border focus:outline-none focus-visible:border-[#1769ff] focus-visible:ring-2 focus-visible:ring-[#1769ff]/20 transition-colors ${
                    !formData.subcategory_id
                      ? "bg-gray-100 cursor-not-allowed"
                      : ""
                  } ${errors.model_id ? "border-red-300" : "border-gray-200"}`}
                >
                  <span
                    className={`block truncate ${!formData.subcategory_id ? "text-gray-400" : ""}`}
                  >
                    {filteredModels.find((m) => m.id === formData.model_id)
                      ? `${filteredModels.find((m) => m.id === formData.model_id)?.name} (${filteredModels.find((m) => m.id === formData.model_id)?.brand})`
                      : formData.subcategory_id
                        ? "Select model"
                        : "Select subcategory first"}
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
                    {filteredModels.length === 0 ? (
                      <div className="py-2 pl-4 pr-4 text-gray-500 text-sm">
                        No model available
                      </div>
                    ) : (
                      filteredModels.map((model) => (
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
                                className={`block truncate ${selected ? "font-medium" : "font-normal"}`}
                              >
                                {model.name} ({model.brand})
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
                      ))
                    )}
                  </Listbox.Options>
                </Transition>
              </div>
            </Listbox>
            {errors.model_id && (
              <p className="mt-1 text-sm text-red-500">{errors.model_id}</p>
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

          {/* SKU (Auto-generated) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              SKU *
            </label>
            <input
              type="text"
              name="sku"
              value={formData.sku}
              readOnly
              className={`w-full px-3 py-2 border rounded-lg bg-gray-50 ${errors.sku ? "border-red-300" : "border-gray-200"}`}
              placeholder="Auto-generated SKU"
            />
            {errors.sku && (
              <p className="mt-1 text-sm text-red-500">{errors.sku}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              SKU format: CATEGORY-SUBCATEGORY-MODEL-SEQUENCE (e.g.,
              AUD-SPK-QSC-0001)
            </p>
          </div>

          {/* Serial Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Serial Number
            </label>
            <input
              type="text"
              name="serial_number"
              value={formData.serial_number}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
              placeholder="Enter serial number"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Location
            </label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
              placeholder="Enter location"
            />
          </div>

          {/* Sub Location */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sub Location
            </label>
            <input
              type="text"
              name="sub_location"
              value={formData.sub_location}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
              placeholder="Enter sub location"
            />
          </div>

          {/* Purchase Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Purchase Date
            </label>
            <input
              type="date"
              name="purchase_date"
              value={formData.purchase_date}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
            />
          </div>

          {/* Warranty Expiry */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Warranty Expiry
            </label>
            <input
              type="date"
              name="warranty_expiry"
              value={formData.warranty_expiry}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
            />
          </div>

          {/* Last Maintenance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Maintenance
            </label>
            <input
              type="date"
              name="last_maintenance"
              value={formData.last_maintenance}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
            />
          </div>

          {/* Next Maintenance */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Next Maintenance
            </label>
            <input
              type="date"
              name="next_maintenance"
              value={formData.next_maintenance}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
            />
          </div>

          {/* Condition */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Condition *
            </label>
            <select
              name="condition"
              value={formData.condition}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] ${
                errors.condition ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="excellent">Excellent</option>
              <option value="good">Good</option>
              <option value="fair">Fair</option>
              <option value="poor">Poor</option>
            </select>
            {errors.condition && (
              <p className="mt-1 text-sm text-red-500">{errors.condition}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] ${
                errors.status ? "border-red-300" : "border-gray-200"
              }`}
            >
              <option value="available">Available</option>
              <option value="rented">Rented</option>
              <option value="maintenance">Maintenance</option>
              <option value="retired">Retired</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-500">{errors.status}</p>
            )}
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff]"
              placeholder="Enter notes"
            />
          </div>

          {/* Submit Button */}
          <div className="flex gap-4">
            <Button type="submit" disabled={isSubmitting} className="flex-1">
              {isSubmitting ? "Adding..." : "Add Asset"}
            </Button>
            <Link href="/inventory-manager/equipments" className="flex-1">
              <Button variant="secondary" className="w-full">
                Cancel
              </Button>
            </Link>
          </div>
        </form>
      </main>
    </div>
  );
}
