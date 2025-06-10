"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

import { toast } from "react-hot-toast";
import TemplateItem from "@/components/magnepixit/template-item";
import CreateTemplateModal from "@/components/magnepixit/create-template-modal";

import { IconPlus } from "@tabler/icons-react";

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

interface TemplatesListProps {
  initialTemplates: Template[];
  etsyProducts: EtsyProduct[];
}

export default function TemplatesList({
  initialTemplates,
  etsyProducts,
}: TemplatesListProps) {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const supabase = createClient();

  const handleTemplateCreated = (newTemplate: Template) => {
    setTemplates((prev) => [newTemplate, ...prev]);
    toast.success("Template created successfully");
  };

  const handleTemplateUpdated = (updatedTemplate: Template) => {
    setTemplates((prev) =>
      prev.map((template) =>
        template.id === updatedTemplate.id ? updatedTemplate : template,
      ),
    );
    toast.success("Template updated successfully");
  };

  const handleTemplateDeleted = (templateId: string) => {
    setTemplates((prev) =>
      prev.filter((template) => template.id !== templateId),
    );
    toast.success("Template deleted successfully");
  };

  const handleTemplateDuplicated = async (originalTemplate: Template) => {
    try {
      const { data, error } = await supabase
        .from("templates")
        .insert({
          product_name: `${originalTemplate.product_name} (Copy)`,
          product_id: "", // Will need to be set when applied to a product
          template: originalTemplate.template,
        })
        .select()
        .single();

      if (error) throw error;

      setTemplates((prev) => [data, ...prev]);
      toast.success("Template duplicated successfully");
    } catch (error) {
      console.error("Error duplicating template:", error);
      toast.error("Failed to duplicate template");
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-neutral-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-neutral-900">
            Templates ({templates.length})
          </h2>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
          >
            <IconPlus size={20} />
            Create Template
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-neutral-500 mb-4">
              No templates created yet. Create your first template to get
              started.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#5B9994] text-white rounded-lg hover:bg-[#4A8075] transition-colors"
            >
              <IconPlus size={20} />
              Create Your First Template
            </button>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200">
            {templates.map((template) => (
              <TemplateItem
                key={template.id}
                template={template}
                etsyProducts={etsyProducts}
                onUpdate={handleTemplateUpdated}
                onDelete={handleTemplateDeleted}
                onDuplicate={handleTemplateDuplicated}
                allTemplates={templates}
              />
            ))}
          </div>
        )}
      </div>

      <CreateTemplateModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreated={handleTemplateCreated}
        etsyProducts={etsyProducts}
      />
    </div>
  );
}
