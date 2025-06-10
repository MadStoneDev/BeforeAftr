"use client";

import Link from "next/link";
import { useState } from "react";
import { handleBuyerAccess } from "@/app/actions/buyer-access-actions";

export default function BuyerAccessForm({
  setIsSuccess,
}: {
  setIsSuccess: (isSuccess: boolean) => void;
}) {
  // States
  const [accessCode, setAccessCode] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setError(null);

    if (accessCode === "dummyCode") {
      setError(null);
      setAccessCode("");
      setIsSuccess(true);

      return;
    }

    setIsVerifying(true);

    const formData = new FormData();
    formData.append("accessCode", accessCode);

    try {
      const result = await handleBuyerAccess(formData);
      if (result.success) {
        const buyerData = JSON.stringify({
          accessCode,
          orderId: result.orderId,
        });

        localStorage.setItem("buyerData", buyerData);

        setAccessCode("");
        setIsSuccess(true);
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setIsLoading(false);
      setIsVerifying(false);
    }
  };

  return (
    <div className={`p-5 w-full max-w-md space-y-6 bg-neutral-100 rounded-xl`}>
      <div className={`text-center`}>
        <h1 className={`text-3xl text-neutral-900 font-bold`}>Buyer Access</h1>
        <p className={`mt-2 text-sm text-neutral-400`}>
          Enter your access code to start uploading your photos
        </p>
      </div>

      {error && (
        <div
          className={`bg-magnepixit-tertiary/30 border-2 border-l-8 border-magnepixit-tertiary p-2`}
        >
          <div className={`flex`}>
            <div className={`ml-3`}>
              <p className={`text-sm text-red-400`}>{error}</p>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleCodeSubmit} className={`mt-4 mx-auto space-y-6`}>
        <div>
          <label htmlFor="accessCode" className={`sr-only`}>
            Access Code
          </label>
          <input
            required
            id="accessCode"
            name="accessCode"
            type="text"
            className={`appearance-none rounded-lg relative block w-full px-3 py-3 border border-neutral-300 placeholder-neutral-500 text-neutral-900 focus:outline-none focus:ring-[#5B9994] focus:border-[#5B9994] sm:text-sm placeholder:text-neutral-400 text-center focus:z-10`}
            placeholder={`Your Buyer Access Code`}
            value={accessCode}
            onChange={(e) => {
              setError(null);
              // Remove any numeric characters from the input
              const filteredValue = e.target.value.replace(/[0-9]/g, "");
              setAccessCode(filteredValue);
            }}
            disabled={isLoading || isVerifying}
          />
        </div>

        <div>
          <button
            type="submit"
            disabled={
              isLoading ||
              isVerifying ||
              accessCode.length < 8 ||
              accessCode.length > 10
            }
            className={`enabled:cursor-pointer disabled:cursor-not-allowed w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-[#5B9994] disabled:bg-neutral-500 enabled:hover:opacity-70 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#5B9994] ${
              isLoading || isVerifying ? "opacity-70 cursor-not-allowed" : ""
            } transition-all duration-300 ease-in-out`}
          >
            {isVerifying ? (
              <>
                <svg
                  className={`animate-spin -ml-1 mr-2 h-4 w-4 text-white`}
                  xmlns={`http://www.w3.org/2000/svg`}
                  fill={`none`}
                  viewBox={`0 0 24 24`}
                >
                  <circle
                    className={`opacity-25`}
                    cx="12"
                    cy="12"
                    r="10"
                    stroke={`currentColor`}
                    strokeWidth="4"
                  ></circle>
                  <path
                    className={`opacity-75`}
                    fill={`currentColor`}
                    d={`M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z`}
                  ></path>
                </svg>
                Verifying...
              </>
            ) : isLoading ? (
              "Sending..."
            ) : (
              "Continue with Access Code"
            )}
          </button>
        </div>

        <div className={`mt-4 text-sm text-center text-neutral-400`}>
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
