import type { PickerCapability } from "./types";

export function detectPickerCapability(): PickerCapability {
  if (typeof window === "undefined") return "none";
  if (
    "showDirectoryPicker" in window &&
    typeof (window as unknown as { showDirectoryPicker?: unknown })
      .showDirectoryPicker === "function"
  ) {
    return "fs-access";
  }
  if (typeof document !== "undefined") {
    const input = document.createElement("input");
    if ("webkitdirectory" in input) return "webkit-directory";
  }
  return "none";
}
