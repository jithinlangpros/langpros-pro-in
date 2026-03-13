"use client";

import { useState } from "react";
import { login } from "./actions";
import Button from "@/components/Button";

export default function Home() {
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [isLoading, setIsLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setIsLoading(true);
    setErrors({});

    const newErrors: { email?: string; password?: string } = {};
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    if (!email || !email.includes("@")) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password || password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setIsLoading(false);
      return;
    }

    const result = await login(formData);

    if (result?.error) {
      try {
        const parsed = JSON.parse(result.error);
        setErrors(parsed);
      } catch {
        setErrors({ general: result.error });
      }
    }

    setIsLoading(false);
  }

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#1769ff] p-12 flex-col justify-between">
        <div>
          <div className="flex items-center gap-3 text-white">
            <span className="font-semibold text-xl tracking-wide">
              LANGRPROS
            </span>
          </div>
        </div>

        <div>
          <h2 className="text-5xl font-bold text-white leading-tight mb-4">
            Create.
            <br />
            Manage.
            <br />
            Inspire.
          </h2>
          <p className="text-white/70 text-lg max-w-md">
            Your all-in-one platform for project and inventory management
          </p>
        </div>

        <div className="text-white/50 text-sm">
          © Copyright 2026 | Langpros Language Solutions
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-sm">
          <div className="lg:hidden mb-10">
            <div className="flex items-center gap-3 text-[#1769ff]">
              <span className="font-semibold text-xl tracking-wide">
                LANGRPROS
              </span>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back
          </h1>
          <p className="text-gray-500 mb-8">Enter your details to continue</p>

          {errors.general && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{errors.general}</p>
            </div>
          )}

          <form action={handleSubmit} className="space-y-5">
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                placeholder="hello@example.com"
                required
                className={`w-full px-4 py-3 rounded-lg bg-gray-50 border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 transition-all ${
                  errors.email
                    ? "border-red-400"
                    : "border-gray-200 focus:border-[#1769ff]"
                }`}
              />
              {errors.email && (
                <p className="text-xs text-red-500 mt-1.5">{errors.email}</p>
              )}
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                placeholder="••••••••"
                required
                minLength={6}
                className={`w-full px-4 py-3 rounded-lg bg-gray-50 border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1769ff]/20 transition-all ${
                  errors.password
                    ? "border-red-400"
                    : "border-gray-200 focus:border-[#1769ff]"
                }`}
              />
              {errors.password && (
                <p className="text-xs text-red-500 mt-1.5">{errors.password}</p>
              )}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {isLoading ? "Signing in..." : "Sign in"}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
