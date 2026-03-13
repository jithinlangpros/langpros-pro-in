"use client";
import Link from "next/link";
import Button from "@/components/Button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="text-center px-6">
        <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-12 h-12 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>

        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Page Not Found
        </h2>

        <p className="text-gray-500 mb-8 max-w-md mx-auto">
          Sorry, we could not find the page you are looking for. The page might
          have been removed or renamed.
        </p>

        <div className="flex items-center justify-center gap-4">
          <Link href="/inventory-manager">
            <Button variant="primary">Go to Dashboard</Button>
          </Link>

          <Button onClick={() => window.history.back()} variant="primary">
            Go Back
          </Button>
        </div>
      </div>
    </div>
  );
}
