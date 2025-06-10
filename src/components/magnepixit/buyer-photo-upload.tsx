"use client";

import { useEffect, useState } from "react";
import PhotoCropper from "@/components/magnepixit/photo-cropper";

interface BuyerData {
  accessCode: string;
  orderId: string;
}

interface PhotoConfig {
  width: number; // in mm
  height: number; // in mm
  title?: string;
  productName?: string;
}

interface PhotoData {
  originalPhoto: string | null;
  croppedPhoto: string | null;
}

// Example usage component
export default function PhotoUploadPage() {
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [buyerData] = useState<BuyerData>({
    accessCode: "ABC123",
    orderId: "order-456",
  });

  const photoConfigs: PhotoConfig[] = [
    {
      width: 85,
      height: 55,
      title: "Business Card",
      productName: "Premium Cards",
    },
    {
      width: 100,
      height: 150,
      title: "Photo Print",
      productName: "Glossy Photo",
    },
    {
      width: 210,
      height: 297,
      title: "A4 Poster",
      productName: "Wall Art",
    },
  ];

  // State to track photos for each PhotoCropper instance
  const [photosData, setPhotosData] = useState<PhotoData[]>(
    photoConfigs.map(() => ({ originalPhoto: null, croppedPhoto: null })),
  );

  const handleCropComplete = (
    croppedImage: string,
    originalImage: string,
    config: PhotoConfig,
  ) => {
    console.log("Crop completed for:", config.title);
    console.log("Original image:", originalImage.substring(0, 50) + "...");
    console.log("Cropped image:", croppedImage.substring(0, 50) + "...");
    console.log("Config:", config);
    console.log("Buyer data:", buyerData);

    // Here you would upload to Supabase:
    // 1. Upload original image to 'photos' bucket
    // 2. Upload cropped image to 'photos' bucket
    // 3. Insert record into photos table with order_id from buyerData
  };

  // Handler for when photos change in a specific PhotoCropper
  const handlePhotosChange =
    (index: number) =>
    (originalPhoto: string | null, croppedPhoto: string | null) => {
      setPhotosData((prev) => {
        const newData = [...prev];
        newData[index] = { originalPhoto, croppedPhoto };
        return newData;
      });
    };

  // Handler to upload all photos to Supabase
  const handleUploadAllPhotos = async () => {
    const photosToUpload = photosData.filter(
      (photoData) => photoData.originalPhoto && photoData.croppedPhoto,
    );

    if (photosToUpload.length === 0) {
      alert("Please upload and crop at least one photo before submitting.");
      return;
    }

    console.log("Ready to upload photos:", photosToUpload);
    console.log("Buyer data:", buyerData);

    // Here you would implement the Supabase upload logic:
    /*
    for (let i = 0; i < photosData.length; i++) {
      const photoData = photosData[i];
      if (photoData.originalPhoto && photoData.croppedPhoto) {
        const config = photoConfigs[i];
        
        // Convert data URLs to blobs
        const originalBlob = dataURLtoBlob(photoData.originalPhoto);
        const croppedBlob = dataURLtoBlob(photoData.croppedPhoto);
        
        // Upload to Supabase storage
        const originalUpload = await supabase.storage
          .from('photos')
          .upload(`originals/${buyerData.orderId}_${config.title}_original_${Date.now()}.jpg`, originalBlob);
          
        const croppedUpload = await supabase.storage
          .from('photos')
          .upload(`cropped/${buyerData.orderId}_${config.title}_cropped_${Date.now()}.jpg`, croppedBlob);
        
        // Insert record into photos table
        await supabase.from('photos').insert({
          order_id: buyerData.orderId,
          access_code: buyerData.accessCode,
          original_url: originalUpload.data?.path,
          cropped_url: croppedUpload.data?.path,
          config: config,
          created_at: new Date().toISOString()
        });
      }
    }
    */

    alert(
      `Ready to upload ${photosToUpload.length} photo(s) for order ${buyerData.orderId}`,
    );
  };

  // Helper function to check if all required photos are ready
  const getUploadReadyCount = () => {
    return photosData.filter(
      (photoData) => photoData.originalPhoto && photoData.croppedPhoto,
    ).length;
  };

  useEffect(() => {
    console.log("Photos data updated:", photosData);
  }, [photosData]);

  return (
    <div
      className={`p-12 flex flex-col justify-between min-h-screen w-full bg-neutral-200 text-neutral-900`}
    >
      <div className={`mx-auto text-center`}>
        <h1 className={`text-2xl font-bold text-center mb-8`}>
          Upload Photos for Your Order
        </h1>

        <section
          className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6`}
        >
          {photoConfigs.map((config, index) => (
            <PhotoCropper
              key={`${config.width}-${config.height}-${index}`}
              config={config}
              mode={`specific`}
              onCropComplete={handleCropComplete}
              buyerData={buyerData}
              originalPhoto={photosData[index]?.originalPhoto || undefined}
              croppedPhoto={photosData[index]?.croppedPhoto || undefined}
              onPhotosChange={handlePhotosChange(index)}
            />
          ))}
        </section>

        {/* Upload Progress */}
        <section
          className={`mx-auto w-full max-w-xl space-y-3 text-center my-6`}
        >
          <p className={`text-sm text-neutral-600`}>
            {getUploadReadyCount()} of {photoConfigs.length} photos ready for
            upload
          </p>

          <div
            className={`${
              isConfirmed
                ? "bg-magnepixit-primary/20 text-white"
                : "bg-magnepixit-tertiary"
            } rounded-lg p-3 mb-4 text-left transition-all duration-300 ease-in-out`}
          >
            <label className={`flex items-start gap-3 cursor-pointer`}>
              <input
                type={`checkbox`}
                checked={isConfirmed}
                onChange={(e) => setIsConfirmed(e.target.checked)}
                className={`mt-1 w-4 h-4 bg-neutral-100 border-neutral-300 rounded`}
                style={{
                  accentColor: isConfirmed ? "#5B9994" : "#171717",
                }}
              />
              <div className={`text-sm text-neutral-700 leading-relaxed`}>
                <span className={`font-bold`}>Quality Confirmation:</span>
                <br />I have carefully reviewed all uploaded photos and their
                cropping areas. I confirm that the images are of sufficient
                quality, properly oriented, and accurately cropped for print
                production. I understand that these images will be used for
                manufacturing my products and accept responsibility for the
                final print quality.
              </div>
            </label>
          </div>

          {getUploadReadyCount() === photoConfigs.length && (
            <button
              onClick={handleUploadAllPhotos}
              className={`mt-2 px-6 py-2 bg-magnepixit-primary text-white rounded-lg hover:bg-magnepixit-primary/70 transition-all duration-300`}
            >
              Upload Photo(s)
            </button>
          )}
        </section>
      </div>

      <section>
        {/* Debug Info */}
        <div className={`col-span-full mt-8 p-4 bg-white rounded-lg border`}>
          <h3 className={`text-lg font-semibold mb-4`}>Debug: Photos State</h3>
          <div className={`grid grid-cols-1 md:grid-cols-3 gap-4`}>
            {photosData.map((photoData, index) => (
              <div key={index} className={`p-3 bg-neutral-100 rounded`}>
                <h4 className={`font-medium`}>{photoConfigs[index].title}</h4>
                <p className={`text-xs text-neutral-600`}>
                  Original:{" "}
                  {photoData.originalPhoto ? "✅ Uploaded" : "❌ Missing"}
                </p>
                {/*<p>{photoData.originalPhoto}</p>*/}
                <p className={`text-xs text-neutral-600`}>
                  Cropped: {photoData.croppedPhoto ? "✅ Ready" : "❌ Missing"}
                </p>
                {/*<p>{photoData.croppedPhoto}</p>*/}
              </div>
            ))}
          </div>
        </div>

        {/* Example of standard mode */}
        {/*<PhotoCropper*/}
        {/*  config={{ width: 100, height: 100, title: "Flexible Upload" }}*/}
        {/*  mode="standard"*/}
        {/*  onCropComplete={handleCropComplete}*/}
        {/*  buyerData={buyerData}*/}
        {/*/>*/}
      </section>
    </div>
  );
}
