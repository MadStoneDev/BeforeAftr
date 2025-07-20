"use client";

import { useState, useCallback } from "react";
import { createClient } from "@/utils/supabase/client";
import { toast } from "react-hot-toast";
import {
  IconDownload,
  IconX,
  IconCheck,
  IconCopy,
  IconChevronDown,
  IconChevronUp,
  IconPhoto,
  IconLoader2,
} from "@tabler/icons-react";

import RejectModal from "@/components/magnepixit/reject-modal";
import { Database } from "../../../database.types";

type Order = Database["public"]["Tables"]["magnepixit_orders"]["Row"];
type Photo = Database["public"]["Tables"]["magnepixit_photos"]["Row"];

interface OrderItemProps {
  order: Order;
  onStatusUpdate: (orderId: string, newStatus: string) => void;
}

export default function OrderItem({ order, onStatusUpdate }: OrderItemProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [photosLoaded, setPhotosLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const supabase = createClient();

  // Safe accessors for potentially null fields
  const orderNumber = order.order_no || "N/A";
  const customerName = order.customer_name || "Unknown Customer";
  const customerEmail = order.customer_email || "No email provided";
  const orderDate = order.order_date || order.created_at;
  const accessCode = order.access_code || "No access code";
  const status = order.status || "unknown";

  const getStatusDisplay = (status: string) => {
    switch (status) {
      case "RC":
        return {
          text: "Photos Uploaded",
          className: "bg-blue-100 text-blue-800",
        };
      case "RI":
        return {
          text: "Rejected",
          className: "bg-red-100 text-red-800",
        };
      case "OC":
        return {
          text: "Completed",
          className: "bg-green-100 text-green-800",
        };
      case "unknown":
        return {
          text: "Unknown",
          className: "bg-gray-100 text-gray-800",
        };
      default:
        return {
          text: "Pending",
          className: "bg-yellow-100 text-yellow-800",
        };
    }
  };

  const loadPhotos = useCallback(async () => {
    if (photosLoaded || !order.order_no) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("magnepixit_photos")
        .select("*")
        .eq("order_id", order.order_no)
        .order("created_at", { ascending: true });

      if (error) throw error;
      setPhotos(data || []);
      setPhotosLoaded(true);
    } catch (error) {
      console.error("Error loading photos:", error);
      toast.error("Failed to load photos");
    } finally {
      setLoading(false);
    }
  }, [photosLoaded, order.order_no, supabase]);

  const downloadPhotos = async () => {
    await loadPhotos();

    if (photos.length === 0) {
      toast.error("No photos found for this order");
      return;
    }

    try {
      for (const photo of photos) {
        if (photo.cropped_photo) {
          const { data, error } = await supabase.storage
            .from("magnepixit_photos")
            .download(photo.cropped_photo);

          if (error) throw error;

          const url = URL.createObjectURL(data);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${orderNumber}_photo_${photo.id.slice(0, 8)}.jpg`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      }
      toast.success(`Downloaded ${photos.length} photos`);
    } catch (error) {
      console.error("Error downloading photos:", error);
      toast.error("Failed to download photos");
    }
  };

  const completeOrder = async () => {
    try {
      const purgeDate = new Date();
      purgeDate.setDate(purgeDate.getDate() + 30);

      const { error } = await supabase
        .from("magnepixit_orders")
        .update({
          status: "OC",
          purge_on: purgeDate.toISOString(),
          updated_on: new Date().toISOString(),
        })
        .eq("id", order.id);

      if (error) throw error;

      onStatusUpdate(order.id, "OC");
      toast.success("Order marked as completed");
    } catch (error) {
      console.error("Error completing order:", error);
      toast.error("Failed to complete order");
    }
  };

  const copyAccessCode = () => {
    if (order.access_code) {
      navigator.clipboard.writeText(order.access_code);
      toast.success("Access code copied to clipboard");
    } else {
      toast.error("No access code available");
    }
  };

  const toggleExpanded = () => {
    setExpanded(!expanded);
    if (!expanded && !photosLoaded) {
      loadPhotos();
    }
  };

  const statusDisplay = getStatusDisplay(status);

  return (
    <div className="group hover:bg-neutral-100 transition-all duration-300 ease-in-out">
      <div className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-grow">
            <div className="flex flex-col-reverse sm:flex-row items-start sm:items-center gap-1 mb-2">
              <h3 className="font-semibold text-lg">Order: {orderNumber}</h3>
              <span
                className={`px-2 py-1 text-xs font-medium rounded ${statusDisplay.className}`}
              >
                {statusDisplay.text}
              </span>
              {photos.length > 0 && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  {photos.length} photo{photos.length !== 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="text-sm text-neutral-600 space-y-1">
              <p>
                <span className="font-medium">Customer:</span> {customerName}
              </p>
              <p>
                <span className="font-medium">Email:</span> {customerEmail}
              </p>
              <p>
                <span className="font-medium">Order Date:</span>{" "}
                {new Date(orderDate).toLocaleDateString()}
              </p>
            </div>

            {order.access_code && (
              <div className="mt-3 flex items-center gap-2">
                <span className="text-sm font-medium text-neutral-700">
                  Access Code:
                </span>
                <code className="px-2 py-1 bg-neutral-200 rounded text-sm font-mono">
                  {accessCode}
                </code>
                <button
                  onClick={copyAccessCode}
                  className="p-1.5 hover:bg-neutral-200 rounded transition-all duration-300 ease-in-out"
                  title="Copy access code"
                >
                  <IconCopy size={16} />
                </button>
              </div>
            )}
          </div>

          <div
            className={`ml-4 flex flex-col sm:flex-row items-center gap-2 transition-all duration-300 ease-in-out`}
          >
            <button
              onClick={downloadPhotos}
              className="p-2 hover:bg-blue-500 hover:text-white rounded-lg transition-all duration-300 ease-in-out"
              title="Download all photos"
            >
              <IconDownload size={20} />
            </button>

            {status !== "OC" && (
              <>
                <button
                  onClick={() => setShowRejectModal(true)}
                  className="p-2 hover:bg-red-500 hover:text-white rounded-lg transition-all duration-300 ease-in-out"
                  title="Reject order"
                >
                  <IconX size={20} />
                </button>

                <button
                  onClick={completeOrder}
                  className="p-2 hover:bg-green-500 hover:text-white rounded-lg transition-all duration-300 ease-in-out"
                  title="Mark as completed"
                >
                  <IconCheck size={20} />
                </button>
              </>
            )}

            <button
              onClick={toggleExpanded}
              className="p-2 hover:bg-neutral-200 rounded-lg transition-all duration-300 ease-in-out"
              title={expanded ? "Hide details" : "Show details"}
            >
              {expanded ? (
                <IconChevronUp size={20} />
              ) : (
                <IconChevronDown size={20} />
              )}
            </button>
          </div>
        </div>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-neutral-200">
            <div className="flex items-center gap-2 mb-3">
              <IconPhoto size={20} />
              <h4 className="font-medium text-sm text-neutral-700">
                Photos ({photos.length})
              </h4>
              {loading && (
                <IconLoader2
                  size={16}
                  className="animate-spin text-neutral-500"
                />
              )}
            </div>

            {photos.length > 0 ? (
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
                {photos.map((photo) => (
                  <div
                    key={photo.id}
                    className="aspect-square bg-neutral-100 rounded-lg overflow-hidden border"
                  >
                    {photo.cropped_photo && (
                      <img
                        src={`${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/magnepixit_photos/${photo.cropped_photo}`}
                        alt={`Photo ${photo.id}`}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                        loading="lazy"
                      />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 text-neutral-500 text-sm">
                No photos uploaded yet
              </div>
            )}
          </div>
        )}
      </div>

      <RejectModal
        isOpen={showRejectModal}
        onClose={() => setShowRejectModal(false)}
        order={order}
        onReject={(reason) => {
          onStatusUpdate(order.id, "RI");
          setShowRejectModal(false);
          toast.success("Order rejected and customer notified");
        }}
      />
    </div>
  );
}
