import { X, AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  onConfirm,
  onClose,
  danger = false,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-[rgba(0,229,255,0.12)] bg-[#161a23] p-6">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className={danger ? "text-[#ff3131]" : "text-[#ff5c00]"} />
            <h3
              style={{
                fontFamily: "'Barlow Condensed', sans-serif",
                fontSize: "1.3rem",
                fontWeight: 700,
                color: danger ? "#ff3131" : "#e8eaf0",
              }}
            >
              {title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#7a8099] hover:text-[#e8eaf0] transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Mensagem */}
        <p
          className="text-[#7a8099] text-sm mb-6"
          style={{ fontFamily: "'Inter', sans-serif" }}
        >
          {message}
        </p>

        {/* Botões */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 border border-[rgba(0,229,255,0.12)] text-[#7a8099] hover:text-[#e8eaf0] hover:border-[rgba(0,229,255,0.3)] transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700 }}
          >
            CANCELAR
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 rounded-xl py-3 transition-all hover:opacity-90"
            style={{
              background: danger
                ? "linear-gradient(135deg, #ff3131, #cc0000)"
                : "linear-gradient(135deg, #ff5c00, #cc3300)",
              color: "#fff",
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1rem",
              fontWeight: 700,
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}