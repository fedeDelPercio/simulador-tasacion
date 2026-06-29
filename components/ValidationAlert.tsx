"use client";

interface ValidationAlertProps {
  /** "warning" = ámbar (con posible confirmación) · "error" = rojo (no se confirma) */
  variant?: "warning" | "error";
  message: string;
  /** Si se pasa, muestra un botón de confirmación a la derecha */
  confirmLabel?: string;
  onConfirm?: () => void;
}

export function ValidationAlert({
  variant = "warning",
  message,
  confirmLabel,
  onConfirm,
}: ValidationAlertProps) {
  const isError = variant === "error";
  const colors = isError
    ? {
        box: "bg-red-50 border-red-200",
        icon: "text-red-500",
        text: "text-red-700",
      }
    : {
        box: "bg-amber-50 border-amber-200",
        icon: "text-amber-500",
        text: "text-amber-800",
      };

  return (
    <div
      className={`flex items-start gap-2 px-3 py-2 border rounded-lg ${colors.box}`}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className={`w-4 h-4 flex-shrink-0 mt-0.5 ${colors.icon}`}
      >
        <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        <line x1="12" y1="9" x2="12" y2="13" />
        <line x1="12" y1="17" x2="12.01" y2="17" />
      </svg>
      <p className={`flex-1 text-xs leading-snug ${colors.text}`}>{message}</p>
      {confirmLabel && onConfirm && (
        <button
          onClick={onConfirm}
          className="flex-shrink-0 px-2.5 py-1 bg-white border border-amber-300 text-amber-800 text-[11px] font-medium rounded-md hover:bg-amber-100 transition-colors"
        >
          {confirmLabel}
        </button>
      )}
    </div>
  );
}
