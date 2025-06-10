"use client";

import { useState } from "react";

import {
  IconEdit,
  IconCopy,
  IconTrash,
  IconChevronDown,
  IconChevronUp,
} from "@tabler/icons-react";

import EditTemplateModal from "@/components/magnepixit/edit-template-modal";
import DeleteConfirmModal from "@/components/magnepixit/delete-confirm-modal";
import ApplyTemplateModal from "@/components/magnepixit/apply-template-modal";

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

interface TemplateItemProps {
  template: Template;
  etsyProducts: EtsyProduct[];
  onUpdate: (template: Template) => void;
  onDelete: (templateId: string) => void;
  onDuplicate: (template: Template) => void;
  allTemplates: Template[];
}

export default function TemplateItem({
  template,
  etsyProducts,
  onUpdate,
  onDelete,
  onDuplicate,
  allTemplates,
}: TemplateItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  return (
    <div className="group hover:bg-neutral-50 transition-colors">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <div className="flex items-center gap-4 mb-2">
              <h3 className="font-semibold text-lg">{template.product_name}</h3>
              <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                {template.template.length} photo
                {template.template.length !== 1 ? "s" : ""}
              </span>
            </div>

            <div className="text-sm text-neutral-600">
              <p>
                Created: {new Date(template.created_at).toLocaleDateString()}
              </p>
              <p>
                Last updated:{" "}
                {new Date(template.updated_on).toLocaleDateString()}
              </p>
              {template.product_id && (
                <p>
                  Applied to:{" "}
                  {etsyProducts.find((p) => p.id === template.product_id)
                    ?.title || "Unknown Product"}
                </p>
              )}
            </div>

            {expanded && (
              <div className="mt-4 pt-4 border-t border-neutral-200">
                <h4 className="font-medium mb-3">Photo Configuration:</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {template.template.map((config, index) => (
                    <div key={index} className="p-3 bg-neutral-100 rounded-lg">
                      <h5 className="font-medium text-sm">{config.title}</h5>
                      <p className="text-xs text-neutral-600">
                        {config.productName}
                      </p>
                      <p className="text-xs text-neutral-500">
                        {config.width}mm × {config.height}mm
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 ml-4">
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-colors"
              title={expanded ? "Hide details" : "Show details"}
            >
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </button>

            <button
              onClick={() => setShowApplyModal(true)}
              className="px-3 py-1 text-xs bg-green-100 text-green-800 rounded hover:bg-green-200 transition-colors"
              title="Apply to products"
            >
              Apply
            </button>

            <button
              onClick={() => setShowEditModal(true)}
              className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-colors"
              title="Edit template"
            >
              <IconEdit size={20} />
            </button>

            <button
              onClick={() => onDuplicate(template)}
              className="p-2 hover:bg-yellow-500 hover:text-white rounded-lg transition-colors"
              title="Duplicate template"
            >
              <IconCopy size={20} />
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-colors"
              title="Delete template"
            >
              <IconTrash size={20} />
            </button>
          </div>
        </div>
      </div>

      <EditTemplateModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        template={template}
        etsyProducts={etsyProducts}
        onUpdated={onUpdate}
      />

      <DeleteConfirmModal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        template={template}
        allTemplates={allTemplates}
        onDeleted={onDelete}
      />

      <ApplyTemplateModal
        isOpen={showApplyModal}
        onClose={() => setShowApplyModal(false)}
        template={template}
        etsyProducts={etsyProducts}
        onApplied={onUpdate}
      />
    </div>
  );
}
