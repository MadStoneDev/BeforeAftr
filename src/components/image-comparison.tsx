"use client";

import React, { DragEvent, useEffect, useRef, useState } from "react";

import { FileInput } from "@/components/magnepixit/file-input";
import type { ImageState, ImageType } from "@/types/image-comparison";

const ImageComparison: React.FC = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const [containerHeight, setContainerHeight] = useState<number>(0);
  const [images, setImages] = useState<ImageState>({
    before: null,
    after: null,
  });
  const containerRef = useRef<HTMLDivElement>(null);

  const calculateContainerDimensions = (imageUrl: string) => {
    const img = new Image();

    img.onload = () => {
      const aspectRatio = img.width / img.height;
      let newWidth =
        containerRef.current?.parentElement?.offsetWidth || window.innerWidth;
      let newHeight = newWidth / aspectRatio;

      if (newHeight > 700) {
        newHeight = 700;
        newWidth = newHeight * aspectRatio;
      }

      setContainerWidth(newWidth);
      setContainerHeight(newHeight);
    };
    img.src = imageUrl;
  };

  // Track container width on resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        // Get parent width as maximum available width
        const parentWidth =
          containerRef.current.parentElement?.offsetWidth || window.innerWidth;
        let newWidth =
          containerRef.current.parentElement?.offsetWidth || window.innerWidth;

        // If we have a height set, maintain aspect ratio
        if (containerHeight > 0) {
          const currentAspectRatio = containerWidth / containerHeight;
          // Calculate new height based on new width
          let newHeight = newWidth / currentAspectRatio;

          // If height would exceed max, scale width down
          if (newHeight > 700) {
            newHeight = 700;
            newWidth = newHeight * currentAspectRatio;
          }

          setContainerHeight(newHeight);
        }

        setContainerWidth(newWidth);
      }
    };

    updateDimensions();
    window.addEventListener("resize", updateDimensions);
    return () => window.removeEventListener("resize", updateDimensions);
  }, [containerHeight]);

  const handleImageUpload = (file: File, type: ImageType): void => {
    if (file && file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImages((prev) => ({ ...prev, [type]: result }));

        // If this is the first image uploaded, use it to set container dimensions
        if (!images.before && !images.after) {
          calculateContainerDimensions(result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>): void => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>): void => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handlePointerUp = (): void => {
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>): void => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
      const percentage = (x / rect.width) * 100;
      setSliderPosition(percentage);
    }
  };

  return (
    <section className={`mx-auto flex-grow flex flex-col w-full`}>
      <article className="mb-6 flex gap-6">
        <FileInput
          label="Before Image"
          onChange={(file) => handleImageUpload(file, "before")}
          accept="image/*"
        />
        <FileInput
          label="After Image"
          onChange={(file) => handleImageUpload(file, "after")}
          accept="image/*"
        />
      </article>

      <article
        ref={containerRef}
        className={`flex-grow relative mx-auto max-w-full max-h-[700px] border bg-neutral-100/95 rounded-lg overflow-hidden select-none`}
        style={{
          width: containerWidth ? `${containerWidth}px` : "100%",
          height: containerHeight ? `${containerHeight}px` : "100%",
        }}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDragOver={handleDragOver}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        {/* After (Bottom) Image */}
        <div className={`absolute inset-0 w-full`}>
          <div
            className={`absolute inset-0`}
            style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
          >
            {images.after && (
              <img
                src={images.after}
                alt="After"
                className={`w-full h-full object-cover`}
              />
            )}
          </div>
        </div>

        {/* Before (Top) Image */}
        <div
          className={`absolute inset-0 overflow-hidden`}
          style={{ width: `${sliderPosition}%` }}
        >
          <div
            className={`absolute inset-0`}
            style={{ width: containerWidth ? `${containerWidth}px` : "100%" }}
          >
            {images.before && (
              <img
                src={images.before}
                alt={`Before`}
                className={`w-full h-full object-cover`}
              />
            )}
          </div>
        </div>

        {/* Slider Handle */}
        <div
          className={`absolute top-0 bottom-0 z-50 touch-none`}
          style={{ left: `${sliderPosition}%` }}
          onPointerDown={handlePointerDown}
        >
          <div className={`absolute left-0 w-0.5 h-full bg-white`}></div>

          <div
            className={`absolute left-0 top-1/2 -translate-x-1/2 -translate-y-1/2`}
          >
            <div
              className={`w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center cursor-grab active:cursor-grabbing`}
            ></div>
          </div>
        </div>
      </article>
    </section>
  );
};

export default ImageComparison;
