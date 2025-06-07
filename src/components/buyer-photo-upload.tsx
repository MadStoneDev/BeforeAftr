"use client";

import { useEffect, useState } from "react";
import ReactCrop, { type Crop } from "react-image-crop";

interface BuyerData {
  accessCode: string;
  orderId: string;
}

export default function BuyerPhotoUpload() {
  // Defaults
  const DEFAULT_BUYER_DATA: BuyerData = {
    accessCode: "",
    orderId: "",
  };

  // States
  const [crop, setCrop] = useState<Crop>({
    unit: "%", // Can be 'px' or '%'
    x: 25,
    y: 25,
    width: 50,
    height: 50,
  });

  const [src, setSrc] = useState<string>("");
  const [buyerData, setBuyerData] = useState<BuyerData>(DEFAULT_BUYER_DATA);

  // Functions
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setSrc(reader.result as string);
      setCrop(centerAspectCrop());
    };
    reader.readAsDataURL(file);
  };

  // Effects
  useEffect(() => {
    let data = DEFAULT_BUYER_DATA;
    const fromLocalStorage = localStorage.getItem("buyerData");

    if (fromLocalStorage) {
      data = JSON.parse(fromLocalStorage);
    }

    setBuyerData(data);
  }, []);

  return (
    <div className={`flex flex-col items-center justify-center gap-6`}>
      <h1 className={`text-xl font-bold`}>Photo Upload</h1>

      {/* Hidden file input */}
      <input
        id="file-input"
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {src ? (
        <ReactCrop crop={crop} onChange={(c) => setCrop(c)}>
          <img src={src} />
        </ReactCrop>
      ) : (
        <div
          onClick={() => document.getElementById("file-input")?.click()}
          className={`cursor-pointer flex items-center justify-center w-[300px] border-4 border-neutral-500 border-dashed hover:bg-neutral-800 rounded-xl text-neutral-500 transition-all duration-300 ease-in-out`}
          style={{
            aspectRatio: 1,
          }}
        >
          Upload a photo to get started
        </div>
      )}
    </div>
  );
}
