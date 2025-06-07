"use client";

import { useState } from "react";
import BuyerAccessForm from "@/components/buyer-access-form";
import BuyerPhotoUpload from "@/components/buyer-photo-upload";

export default function BuyerAccessPage() {
  const [isSuccess, setIsSuccess] = useState(false);

  return (
    <main className={`flex items-center justify-center h-dvh`}>
      {!isSuccess ? (
        <BuyerPhotoUpload />
      ) : (
        <BuyerAccessForm setIsSuccess={setIsSuccess} />
      )}
    </main>
  );
}
