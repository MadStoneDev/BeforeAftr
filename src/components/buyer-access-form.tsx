"use client";

import Link from "next/link";
import { useState } from "react";
import { handleBuyerAccess } from "@/app/actions/buyer-access-actions";

export default function BuyerAccessForm({
  setIsSuccess,
}: {
  setIsSuccess: (isSuccess: boolean) => void;
}) {
  const [accessCode, setAccessCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);
    setIsVerifying(true);

    const formData = new FormData();
    formData.append("accessCode", accessCode);

    try {
      const result = await handleBuyerAccess(formData);
      if (result.success) {
        setIsSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`p-5 w-full max-w-md space-y-8 bg-neutral-100 rounded-xl`}>
      <div className="text-center">
        <h1 className="text-3xl text-neutral-900 font-bold">Buyer Access</h1>
        <p className="mt-2 text-sm text-neutral-400">
          Enter your access code to start uploading your photos
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 my-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleCodeSubmit} className="mt-8 mx-auto space-y-6">
        <div>
          <label htmlFor="accessCode" className="sr-only">
            Email address
          </label>
          <input
            required
            id="accessCode"
            name="accessCode"
            type="text"
            className="appearance-none rounded-lg relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-[#5B9994] focus:border-[#5B9994] sm:text-sm placeholder:text-neutral-400 text-center focus:z-10"
            placeholder="Your Buyer Access Code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            disabled={isLoading}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={isLoading}
            className={`cursor-pointer w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#5B9994] hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B9994] ${
              isLoading ? "opacity-70 cursor-not-allowed" : ""
            } transition-all duration-300 ease-in-out`}
          >
            {isLoading ? "Sending..." : "Continue with Access Code"}
          </button>
        </div>

        <div className="mt-4 text-sm text-center text-neutral-400">
          Looking for Merchant Access instead?{" "}
          <Link
            href={`/magnepixit`}
            className={`p-0.5 hover:px-1.5 hover:bg-[#5B9994] rounded-full hover:text-neutral-100 transition-all duration-300 ease-in-out`}
          >
            Click here
          </Link>
          .
        </div>
      </form>
    </div>
  );
}
