"use client";

import React, { useState, useRef, DragEvent, ChangeEvent } from "react";
import { Upload } from "lucide-react";

// Custom file input component
export const FileInput = ({
  label,
  onChange,
  accept,
}: {
  label: string;
  onChange: (file: File) => void;
  accept?: string;
}) => {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      onChange(file);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      onChange(e.target.files[0]);
    }
  };

  return (
    <div className={`flex-1`}>
      <p className={`mb-2 text-sm font-medium text-neutral-400 text-center`}>
        {label}
      </p>
      <label
        className={`relative flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed cursor-pointer transition-colors duration-200 ease-in-out
          ${
            dragActive
              ? "border-blue-500 bg-blue-50"
              : "border-neutral-300 bg-neutral-100/95 hover:bg-neutral-50 transition-all duration-200 ease-in-out"
          }
        `}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <div
          className={`p-4 flex flex-col items-center justify-center pt-5 pb-6`}
        >
          <Upload
            className={`w-8 h-8 mb-2 ${
              dragActive ? "text-blue-500" : "text-neutral-400"
            }`}
          />
          <p
            className={`block sm:hidden mb-2 text-sm text-neutral-600 text-center`}
          >
            <span className={`font-semibold`}>Tap to upload</span>
          </p>

          <p
            className={`hidden sm:block mb-2 text-sm text-neutral-600 text-center`}
          >
            <span className={`font-semibold`}>Click to upload a {label}</span>{" "}
            or drag and drop
          </p>
          <p
            className={`mt-2 pt-1 border-t border-neutral-400/50 text-xs italic text-neutral-400`}
          >
            Image files only
          </p>
        </div>
        <input
          type="file"
          accept={accept}
          onChange={handleChange}
          className={`hidden`}
        />
      </label>
    </div>
  );
};
