"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

import { IconX, IconPlus, IconTrash } from "@tabler/icons-react";

interface PhotoConfig {
  title: string;
  productName: string;
  width: number;
  height: number;
}

interface Template {
  id: string;
  created_at: string;
  updated_on: string;
  product_name: string;
  product_id: string;
  template: PhotoConfig[];
}

interface EtsyProduct {
  id: string;
  title: string;
}

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template;
  etsyProducts: EtsyProduct[];
  onUpdated: (template: Template) => void;
}

export default function EditTemplateModal({
  isOpen,
  onClose,
  template,
  etsyProducts,
  onUpdated,
}: EditTemplateModalProps) {
  const [templateName, setTemplateName] = useState("");
  const [selectedProduct, setSelectedProduct] = useState("");
  const [photoConfigs, setPhotoConfigs] = useState<PhotoConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (isOpen && template) {
      setTemplateName(template.product_name);
      setSelectedProduct(template.product_id || "");
      setPhotoConfigs([...template.template]);
    }
  }, [isOpen, template]);

  if (!isOpen) return null;

  const addPhotoConfig = () => {
    setPhotoConfigs((prev) => [
      ...prev,
      { title: "", productName: "", width: 85, height: 55 },
    ]);
  };

  const removePhotoConfig = (index: number) => {
    if (photoConfigs.length > 1) {
      setPhotoConfigs((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updatePhotoConfig = (
    index: number,
    field: keyof PhotoConfig,
    value: string | number,
  ) => {
    setPhotoConfigs((prev) =>
      prev.map((config, i) =>
        i === index ? { ...config, [field]: value } : config,
      ),
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !templateName.trim() ||
      photoConfigs.some((config) => !config.title.trim())
    )
      return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("templates")
        .update({
          product_name: templateName,
          product_id: selectedProduct,
          template: photoConfigs,
          updated_on: new Date().toISOString(),
        })
        .eq("id", template.id)
        .select()
        .single();

      if (error) throw error;

      onUpdated(data);
      onClose();
    } catch (error) {
      console.error("Error updating template:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h3 className="text-lg font-semibold">Edit Template</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-neutral-100 rounded"
          >
            <IconX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Template Name
            </label>
            <input
              type="text"
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-2">
              Applied to Etsy Product
            </label>
            <select
              value={selectedProduct}
              onChange={(e) => setSelectedProduct(e.target.value)}
              className="w-full px-3 py-2 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#5B9994] focus:border-transparent"
            >
              <option value="">Not applied to any product</option>
              {etsyProducts.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.title}
                </option>
              ))}
            </select>
          </div>

          <div>
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-sm font-medium text-neutral-700">
                Photo Configurations
              </h4>
              <button
                type="button"
                onClick={addPhotoConfig}
                className="inline-flex items-center gap-1 px-3 py-1 text-sm bg-[#5B9994] text-white rounded hover:bg-[#4A8075] transition-colors"
              >
                <IconPlus size={16} />
                Add Photo
              </button>
            </div>

            <div className="space-y-4">
              {photoConfigs.map((config, index) => (
                <div
                  key={index}
                  className="p-4 border border-neutral-200 rounded-lg"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-medium text-sm">Photo {index + 1}</h5>
                    {photoConfigs.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removePhotoConfig(index)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <IconTrash size={16} />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Title
                      </label>
                      <input
                        type="text"
                        value={config.title}
                        onChange={(e) =>
                          updatePhotoConfig(index, "title", e.target.value)
                        }
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994]"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Product Name
                      </label>
                      <input
                        type="text"
                        value={config.productName}
                        onChange={(e) =>
                          updatePhotoConfig(
                            index,
                            "productName",
                            e.target.value,
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994]"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Width (mm)
                      </label>
                      <input
                        type="number"
                        value={config.width}
                        onChange={(e) =>
                          updatePhotoConfig(
                            index,
                            "width",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994]"
                        min="1"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-neutral-600 mb-1">
                        Height (mm)
                      </label>
                      <input
                        type="number"
                        value={config.height}
                        onChange={(e) =>
                          updatePhotoConfig(
                            index,
                            "height",
                            parseInt(e.target.value) || 0,
                          )
                        }
                        className="w-full px-2 py-1 text-sm border border-neutral-300 rounded focus:outline-none focus:ring-1 focus:ring-[#5B9994]"
                        min="1"
                        required
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-neutral-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !templateName.trim()}
              className="px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? "Updating..." : "Update Template"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
