"use client";

import { Modal } from "@/components/ui/Modal";

/**
 * A styled stand-in for window.confirm: it renders inside the app, so the
 * prompt can name the row with rendered LaTeX rather than plain text.
 * Escape and backdrop clicks cancel, courtesy of Modal.
 */
export function ConfirmDialog({
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
}: {
  title: string;
  message: React.ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <Modal title={title} onClose={onCancel}>
      {/* div, not p: RichText renders display math as a block element. */}
      <div className="text-sm text-gray-700">{message}</div>
      <div className="mt-6 flex items-center gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm text-white hover:bg-red-700"
        >
          {confirmLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Cancel
        </button>
      </div>
    </Modal>
  );
}
