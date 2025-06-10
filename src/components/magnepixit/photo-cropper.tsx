"use client";

import { useCallback, useEffect, useRef, useState } from "react";

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

interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface AspectRatio {
  width: number;
  height: number;
}

interface PhotoCropperProps {
  config: PhotoConfig;
  mode: "standard" | "specific";
  onCropComplete?: (
    croppedImage: string,
    originalImage: string,
    config: PhotoConfig,
  ) => void;
  buyerData?: BuyerData;
  originalPhoto?: string; // NEW: Original photo data URL
  croppedPhoto?: string; // NEW: Cropped photo data URL
  onPhotosChange?: (
    originalPhoto: string | null,
    croppedPhoto: string | null,
  ) => void; // NEW: Callback for photo changes
}

export default function PhotoCropper({
  config,
  mode,
  onCropComplete,
  originalPhoto,
  croppedPhoto,
  onPhotosChange,
}: PhotoCropperProps) {
  // Calculate container dimensions based on uploaded image, constrained to min(300px, parent width)
  const calculateContainerSize = useCallback(
    (imageWidth?: number, imageHeight?: number, parentWidth?: number) => {
      const maxSize = Math.min(300, parentWidth || 300);

      if (!imageWidth || !imageHeight) {
        // Default size when no image is loaded
        return { width: maxSize, height: maxSize };
      }

      const imageAspectRatio = imageWidth / imageHeight;

      let containerWidth: number;
      let containerHeight: number;

      if (imageAspectRatio > 1) {
        // Image is wider than tall - limit by width
        containerWidth = maxSize;
        containerHeight = maxSize / imageAspectRatio;
      } else {
        // Image is taller than wide - limit by height
        containerHeight = maxSize;
        containerWidth = maxSize * imageAspectRatio;
      }

      return {
        width: Math.floor(containerWidth),
        height: Math.floor(containerHeight),
      };
    },
    [],
  );

  // Refs
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);

  // Helper function to get parent width
  const getParentWidth = useCallback(() => {
    if (parentRef.current) {
      return parentRef.current.offsetWidth - 32; // Subtract padding (16px * 2)
    }
    return 300; // Fallback to 300px
  }, []);

  const [containerSize, setContainerSize] = useState(() =>
    calculateContainerSize(),
  );
  const [imageNaturalSize, setImageNaturalSize] = useState<{
    width: number;
    height: number;
  } | null>(null);

  // States - Use props if available, otherwise local state
  const [src, setSrc] = useState<string>(originalPhoto || "");
  const [crop, setCrop] = useState<CropArea>({
    x: 20,
    y: 20,
    width: 200,
    height: 200,
  });
  const [confirmCrop, setConfirmCrop] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState<string | null>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [croppedImage, setCroppedImage] = useState<string>(croppedPhoto || "");
  const [aspectRatio, setAspectRatio] = useState<AspectRatio | null>(
    mode === "specific" ? { width: config.width, height: config.height } : null,
  );

  // Update local state when props change
  useEffect(() => {
    if (originalPhoto !== undefined) {
      setSrc(originalPhoto);
    }
  }, [originalPhoto]);

  useEffect(() => {
    if (croppedPhoto !== undefined) {
      setCroppedImage(croppedPhoto);
    }
  }, [croppedPhoto]);

  // Update crop when container size changes
  useEffect(() => {
    setCrop((prev) => ({
      x: Math.min(prev.x, containerSize.width - 50),
      y: Math.min(prev.y, containerSize.height - 50),
      width: Math.min(prev.width, containerSize.width - prev.x),
      height: Math.min(prev.height, containerSize.height - prev.y),
    }));
  }, [containerSize]);

  // Handle window resize to update container size
  useEffect(() => {
    const handleResize = () => {
      if (imageNaturalSize) {
        const parentWidth = getParentWidth();
        const newContainerSize = calculateContainerSize(
          imageNaturalSize.width,
          imageNaturalSize.height,
          parentWidth,
        );
        setContainerSize(newContainerSize);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [imageNaturalSize, calculateContainerSize, getParentWidth]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const imageUrl = reader.result as string;

      // Create a temporary image to get natural dimensions
      const tempImg = new Image();
      tempImg.onload = () => {
        const parentWidth = getParentWidth();
        const newContainerSize = calculateContainerSize(
          tempImg.naturalWidth,
          tempImg.naturalHeight,
          parentWidth,
        );
        setImageNaturalSize({
          width: tempImg.naturalWidth,
          height: tempImg.naturalHeight,
        });
        setContainerSize(newContainerSize);
        setSrc(imageUrl);
        setCroppedImage("");

        // Notify parent component of photo changes
        if (onPhotosChange) {
          onPhotosChange(imageUrl, null);
        }

        // Calculate initial crop size based on mode and aspect ratio
        const currentAspectRatio =
          mode === "specific"
            ? { width: config.width, height: config.height }
            : null;

        let initialCrop = {
          x: 20,
          y: 20,
          width: Math.min(200, newContainerSize.width - 40),
          height: Math.min(200, newContainerSize.height - 40),
        };

        // If mode is specific, apply the aspect ratio immediately
        if (currentAspectRatio) {
          const targetAspect =
            currentAspectRatio.width / currentAspectRatio.height;
          const maxCropWidth = newContainerSize.width - 40;
          const maxCropHeight = newContainerSize.height - 40;

          // Start with a reasonable size and maintain aspect ratio
          let cropWidth = Math.min(200, maxCropWidth);
          let cropHeight = cropWidth / targetAspect;

          // If height is too big, scale down based on height
          if (cropHeight > maxCropHeight) {
            cropHeight = maxCropHeight;
            cropWidth = cropHeight * targetAspect;
          }

          // Ensure minimum size
          if (cropWidth < 50) {
            cropWidth = 50;
            cropHeight = 50 / targetAspect;
          }
          if (cropHeight < 50) {
            cropHeight = 50;
            cropWidth = 50 * targetAspect;
          }

          initialCrop = {
            x: 20,
            y: 20,
            width: cropWidth,
            height: cropHeight,
          };
        }

        setCrop(initialCrop);
      };
      tempImg.src = imageUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleAspectRatioChange = (ratio: AspectRatio | null) => {
    setAspectRatio(ratio);

    if (ratio && containerRef.current) {
      setCrop((prevCrop) => {
        const targetAspect = ratio.width / ratio.height;
        const currentAspect = prevCrop.width / prevCrop.height;

        let newCrop = { ...prevCrop };
        const maxX = containerSize.width;
        const maxY = containerSize.height;

        if (currentAspect > targetAspect) {
          newCrop.width = prevCrop.height * targetAspect;
        } else {
          newCrop.height = prevCrop.width / targetAspect;
        }

        if (newCrop.x + newCrop.width > maxX) {
          newCrop.x = maxX - newCrop.width;
        }
        if (newCrop.y + newCrop.height > maxY) {
          newCrop.y = maxY - newCrop.height;
        }

        if (newCrop.width < 50) {
          newCrop.width = 50;
          newCrop.height = 50 / targetAspect;
        }
        if (newCrop.height < 50) {
          newCrop.height = 50;
          newCrop.width = 50 * targetAspect;
        }

        return newCrop;
      });
    }
  };

  const maintainAspectRatio = (newCrop: CropArea, corner: string): CropArea => {
    if (!aspectRatio) return newCrop;

    const targetAspect = aspectRatio.width / aspectRatio.height;
    let adjustedCrop = { ...newCrop };

    switch (corner) {
      case "se":
        adjustedCrop.height = adjustedCrop.width / targetAspect;
        break;
      case "nw":
        const bottomRightX = newCrop.x + newCrop.width;
        const bottomRightY = newCrop.y + newCrop.height;
        adjustedCrop.height = adjustedCrop.width / targetAspect;
        adjustedCrop.y = bottomRightY - adjustedCrop.height;
        break;
      case "ne":
        const bottomLeftY = newCrop.y + newCrop.height;
        adjustedCrop.width = adjustedCrop.height * targetAspect;
        adjustedCrop.y = bottomLeftY - adjustedCrop.height;
        break;
      case "sw":
        const topRightX = newCrop.x + newCrop.width;
        adjustedCrop.width = adjustedCrop.height * targetAspect;
        adjustedCrop.x = topRightX - adjustedCrop.width;
        break;
    }

    return adjustedCrop;
  };

  const handleMouseDown = (e: React.MouseEvent, action: "drag" | string) => {
    e.preventDefault();

    if (action === "drag") {
      if (!containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();

      setIsDragging(true);
      setDragStart({
        x: e.clientX - containerRect.left - crop.x,
        y: e.clientY - containerRect.top - crop.y,
      });
    } else {
      setIsResizing(action);
    }
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent | React.MouseEvent) => {
      if (!containerRef.current) return;

      const containerRect = containerRef.current.getBoundingClientRect();
      const maxX = containerSize.width;
      const maxY = containerSize.height;
      const mouseX = Math.max(
        0,
        Math.min(e.clientX - containerRect.left, maxX),
      );
      const mouseY = Math.max(0, Math.min(e.clientY - containerRect.top, maxY));

      if (isDragging) {
        setConfirmCrop(false);
        if (onPhotosChange) {
          onPhotosChange(src, null);
        }

        const newX = Math.max(
          0,
          Math.min(mouseX - dragStart.x, maxX - crop.width),
        );
        const newY = Math.max(
          0,
          Math.min(mouseY - dragStart.y, maxY - crop.height),
        );

        setCrop((prev) => ({
          ...prev,
          x: newX,
          y: newY,
        }));
      } else if (isResizing) {
        setConfirmCrop(false);

        if (onPhotosChange) {
          onPhotosChange(src, null);
        }

        setCrop((prev) => {
          let newCrop = { ...prev };

          switch (isResizing) {
            case "se":
              newCrop.width = Math.max(50, mouseX - prev.x);
              newCrop.height = Math.max(50, mouseY - prev.y);
              break;
            case "sw":
              const newWidth = Math.max(50, prev.x + prev.width - mouseX);
              newCrop.width = newWidth;
              newCrop.height = Math.max(50, mouseY - prev.y);
              newCrop.x = Math.max(0, mouseX);
              break;
            case "ne":
              newCrop.width = Math.max(50, mouseX - prev.x);
              const newHeight = Math.max(50, prev.y + prev.height - mouseY);
              newCrop.height = newHeight;
              newCrop.y = Math.max(0, mouseY);
              break;
            case "nw":
              const nwNewWidth = Math.max(50, prev.x + prev.width - mouseX);
              const nwNewHeight = Math.max(50, prev.y + prev.height - mouseY);
              newCrop.width = nwNewWidth;
              newCrop.height = nwNewHeight;
              newCrop.x = Math.max(0, mouseX);
              newCrop.y = Math.max(0, mouseY);
              break;
          }

          newCrop = maintainAspectRatio(newCrop, isResizing);

          newCrop.x = Math.max(0, Math.min(newCrop.x, maxX - newCrop.width));
          newCrop.y = Math.max(0, Math.min(newCrop.y, maxY - newCrop.height));
          newCrop.width = Math.min(newCrop.width, maxX - newCrop.x);
          newCrop.height = Math.min(newCrop.height, maxY - newCrop.y);

          return newCrop;
        });
      }
    },
    [isDragging, isResizing, crop, dragStart, containerSize],
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(null);
  }, []);

  const getCroppedImage = () => {
    if (!imageRef.current || !containerRef.current) return;

    setConfirmCrop(false);

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const img = imageRef.current;
    const container = containerRef.current;

    const scaleX = img.naturalWidth / container.offsetWidth;
    const scaleY = img.naturalHeight / container.offsetHeight;

    canvas.width = crop.width * scaleX;
    canvas.height = crop.height * scaleY;

    ctx.drawImage(
      img,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const croppedDataUrl = canvas.toDataURL("image/jpeg", 0.9);
    setCroppedImage(croppedDataUrl);

    // Notify parent component of cropped photo
    if (onPhotosChange) {
      onPhotosChange(src, croppedDataUrl);
    }

    if (onCropComplete) {
      onCropComplete(croppedDataUrl, src, config);
      setConfirmCrop(true);
    }
  };

  // Global mouse events
  useEffect(() => {
    if (isDragging || isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  return (
    <article
      ref={parentRef}
      className="flex flex-col items-center gap-4 p-4 border border-neutral-200 rounded-lg bg-white w-full max-w-full"
    >
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">
          {config.title || "Photo Upload"}
        </h2>
        {config.productName && (
          <p className="text-sm text-neutral-600">{config.productName}</p>
        )}
        <p className="text-xs text-neutral-500">
          {config.width}mm × {config.height}mm
          {mode === "specific"}
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />

      {src ? (
        <div className={`flex-grow flex flex-col justify-between gap-3`}>
          {/* Cropper */}
          <div
            ref={containerRef}
            className="relative bg-neutral-900 rounded-xl overflow-hidden cursor-crosshair select-none"
            style={{
              width: `${containerSize.width}px`,
              height: `${containerSize.height}px`,
              maxWidth: "100%",
              aspectRatio: `${containerSize.width} / ${containerSize.height}`,
            }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            <img
              ref={imageRef}
              src={src}
              className="w-full h-full object-cover"
              draggable={false}
            />

            <div className="absolute inset-0 bg-black/50 pointer-events-none" />

            <div
              className="absolute border border-white cursor-move"
              style={{
                left: `${crop.x}px`,
                top: `${crop.y}px`,
                width: `${crop.width}px`,
                height: `${crop.height}px`,
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.5)",
              }}
              onMouseDown={(e) => handleMouseDown(e, "drag")}
            >
              <div
                className="absolute w-4 h-4 bg-white border border-neutral-200 rounded-full shadow-lg cursor-nw-resize -top-2 -left-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, "nw");
                }}
              />
              <div
                className="absolute w-4 h-4 bg-white border border-neutral-200 rounded-full shadow-lg cursor-ne-resize -top-2 -right-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, "ne");
                }}
              />
              <div
                className="absolute w-4 h-4 bg-white border border-neutral-200 rounded-full shadow-lg cursor-sw-resize -bottom-2 -left-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, "sw");
                }}
              />
              <div
                className="absolute w-4 h-4 bg-white border border-neutral-200 rounded-full shadow-lg cursor-se-resize -bottom-2 -right-2"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  handleMouseDown(e, "se");
                }}
              />
            </div>
          </div>

          {/* Aspect Ratio Controls - only for standard mode */}
          {mode === "standard" && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-neutral-700">
                Aspect Ratio:
              </h3>
              <div className="flex gap-2 flex-wrap justify-center">
                <button
                  onClick={() => handleAspectRatioChange(null)}
                  className={`px-2 py-1 text-xs rounded ${
                    aspectRatio === null
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  } transition-all duration-500 ease-in-out`}
                >
                  Free
                </button>
                <button
                  onClick={() =>
                    handleAspectRatioChange({ width: 1, height: 1 })
                  }
                  className={`px-2 py-1 text-xs rounded ${
                    aspectRatio?.width === 1 && aspectRatio?.height === 1
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  } transition-all duration-500 ease-in-out`}
                >
                  1:1
                </button>
                <button
                  onClick={() =>
                    handleAspectRatioChange({ width: 4, height: 3 })
                  }
                  className={`px-2 py-1 text-xs rounded ${
                    aspectRatio?.width === 4 && aspectRatio?.height === 3
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  } transition-all duration-500 ease-in-out`}
                >
                  4:3
                </button>
                <button
                  onClick={() =>
                    handleAspectRatioChange({ width: 16, height: 9 })
                  }
                  className={`px-2 py-1 text-xs rounded ${
                    aspectRatio?.width === 16 && aspectRatio?.height === 9
                      ? "bg-blue-600 text-white"
                      : "bg-neutral-200 text-neutral-700 hover:bg-neutral-300"
                  } transition-all duration-500 ease-in-out`}
                >
                  16:9
                </button>
              </div>
            </div>
          )}

          {/* Controls */}
          <div className="flex flex-col gap-2 justify-center">
            <button
              onClick={getCroppedImage}
              disabled={confirmCrop}
              className={`disabled:cursor-not-allowed px-3 py-2 border border-magnepixit-primary enabled:hover:bg-magnepixit-primary/50 hover:text-white ${
                confirmCrop
                  ? "bg-magnepixit-primary text-white"
                  : "text-magnepixit-primary"
              } text-sm rounded-lg transition-all duration-500 ease-in-out`}
            >
              Confirm Crop
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 border border-magnepixit-secondary text-magnepixit-secondary text-sm rounded-lg hover:bg-magnepixit-secondary hover:text-white transition-all duration-500 ease-in-out"
            >
              Change Main Image
            </button>
            <button
              onClick={() => {
                let resetCrop = {
                  x: 20,
                  y: 20,
                  width: Math.min(200, containerSize.width - 40),
                  height: Math.min(200, containerSize.height - 40),
                };

                // If mode is specific, apply the aspect ratio
                if (mode === "specific") {
                  const currentAspectRatio = {
                    width: config.width,
                    height: config.height,
                  };
                  const targetAspect =
                    currentAspectRatio.width / currentAspectRatio.height;
                  const maxCropWidth = containerSize.width - 40;
                  const maxCropHeight = containerSize.height - 40;

                  let cropWidth = Math.min(200, maxCropWidth);
                  let cropHeight = cropWidth / targetAspect;

                  if (cropHeight > maxCropHeight) {
                    cropHeight = maxCropHeight;
                    cropWidth = cropHeight * targetAspect;
                  }

                  if (cropWidth < 50) {
                    cropWidth = 50;
                    cropHeight = 50 / targetAspect;
                  }
                  if (cropHeight < 50) {
                    cropHeight = 50;
                    cropWidth = 50 * targetAspect;
                  }

                  resetCrop = {
                    x: 20,
                    y: 20,
                    width: cropWidth,
                    height: cropHeight,
                  };
                }

                setCrop(resetCrop);
              }}
              className="px-3 py-2 border border-magnepixit-tertiary text-magnepixit-tertiary text-sm rounded-lg hover:bg-magnepixit-tertiary hover:text-white transition-all duration-500 ease-in-out"
            >
              Reset Crop Area
            </button>
          </div>

          {/* Cropped result */}
          {/*{croppedImage && confirmCrop && (*/}
          {/*  <div className="space-y-2 text-center">*/}
          {/*    <h3 className="text-sm font-medium">Result:</h3>*/}
          {/*    <img*/}
          {/*      src={croppedImage}*/}
          {/*      alt="Cropped"*/}
          {/*      className="max-w-32 mx-auto border border-neutral-300 rounded"*/}
          {/*    />*/}
          {/*  </div>*/}
          {/*)}*/}
        </div>
      ) : (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="cursor-pointer flex items-center justify-center border-2 border-dashed border-neutral-400 hover:border-neutral-600 rounded-xl text-neutral-500 hover:text-neutral-700 transition-all duration-500 ease-in-out p-8"
          style={{
            width: `${Math.min(300, getParentWidth())}px`,
            height: `${Math.min(300, getParentWidth())}px`,
            maxWidth: "100%",
            aspectRatio: "1",
          }}
        >
          <div className="text-center">
            <p className="text-sm">Click to upload photo</p>
            <p className="text-xs text-neutral-400 mt-1">
              {config.width}×{config.height}mm
            </p>
          </div>
        </div>
      )}
    </article>
  );
}
