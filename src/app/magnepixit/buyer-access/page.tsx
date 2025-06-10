"use client";

import { useState } from "react";
import BuyerAccessForm from "@/components/magnepixit/buyer-access-form";
import BuyerPhotoUpload from "@/components/magnepixit/buyer-photo-upload";

export default function BuyerAccessPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <main className={`flex items-center justify-center min-h-dvh`}>
      {isSuccess ? (
        <BuyerPhotoUpload />
      ) : (
        <BuyerAccessForm setIsSuccess={setIsSuccess} />
      )}
    </main>
  );
}
