"use client";

import { createClient } from "@/utils/supabase/client";
import { signOut } from "@/app/actions";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, Fragment } from "react";
import { Listbox, Transition, Button } from "@headlessui/react";

interface Category {
  id: number;
  name: string;
  code: string;
}

interface FormErrors {
  category_id?: string;
  name?: string;
  brand_code?: string;
}

export default function AddModelPage() {
  const router = useRouter();
  const supabase = createClient();
  const [userEmail, setUserEmail] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [errors, setErrors] = useState<FormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string>("");

  const [formData, setFormData] = useState({
    category_id: "",
    name: "",
    brand_code: "",
  });

  useEffect(() => {
    async function fetchData() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserEmail(user.email || "");
      }

      const { data: categoriesData } = await supabase
        .from("categories")
        .select("id, name, code")
        .order("name");

      if (categoriesData) {
        setCategories(categoriesData);
      }
    }
    fetchData();
  }, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
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
    if (!formData.name.trim()) {
      newErrors.name = "Model name is required";
    }
    if (!formData.brand_code.trim()) {
      newErrors.brand_code = "Brand code is required";
    } else if (formData.brand_code.length > 10) {
      newErrors.brand_code = "Brand code must be 10 characters or less";
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
      const { error } = await supabase.from("models").insert({
        category_id: parseInt(formData.category_id),
        name: formData.name.trim(),
        brand_code: formData.brand_code.trim().toUpperCase(),
      });

      if (error) {
        setServerError(error.message);
        return;
      }

      router.push("/inventory-manager/add");
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
          <Link href="/inventory-manager/add" className="hover:text-gray-900">
            Add Asset
          </Link>
          <span>/</span>
          <span className="text-gray-900">Add Model</span>
        </div>

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Add New Model</h1>
          <p className="text-gray-500 mt-1">
            Create a new model/brand for your inventory
          </p>
        </div>

        {/* Server Error */}
        {serverError && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {serverError}
          </div>
        )}

        {/* Add Model Form */}
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
                }));
                setErrors((prev) => ({ ...prev, category_id: undefined }));
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
          </div>

          {/* Model Name */}
          <div>
            <label
              htmlFor="name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Model Name *
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors ${
                errors.name ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="e.g., Bosch"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name}</p>
            )}
          </div>

          {/* Brand Code */}
          <div>
            <label
              htmlFor="brand_code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Brand Code *
            </label>
            <input
              type="text"
              id="brand_code"
              name="brand_code"
              value={formData.brand_code}
              onChange={handleChange}
              maxLength={10}
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 focus:border-[#1769ff] transition-colors uppercase ${
                errors.brand_code ? "border-red-300" : "border-gray-200"
              }`}
              placeholder="e.g., BSH"
            />
            {errors.brand_code && (
              <p className="mt-1 text-sm text-red-500">{errors.brand_code}</p>
            )}
            <p className="mt-1 text-xs text-gray-500">
              Short code for asset code generation (max 10 characters)
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-4 pt-4">
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 bg-[#1769ff] text-white rounded-lg hover:bg-[#0052cc] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed data-[active]:bg-[#0052cc]"
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
              {isSubmitting ? "Adding..." : "Add Model"}
            </Button>
            <Link
              href="/inventory-manager/add"
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
