"use client";

import { useState } from "react";
import BuyerAccessForm from "@/components/buyer-access-form";

export default function BuyerAccessPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <main className={`flex items-center justify-center h-dvh`}>
      {!isSuccess ? (
        <div>Success!</div>
      ) : (
        <BuyerAccessForm setIsSuccess={setIsSuccess} />
      )}
    </main>
  );
}
