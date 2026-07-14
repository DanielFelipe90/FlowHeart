import { AlertTriangle } from "lucide-react";
import { createPortal } from "react-dom"; // Importação necessária

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onClose: () => void;
  danger?: boolean;
}

export function ConfirmModal({ title, message, confirmLabel = "Confirmar", onConfirm, onClose, danger = false }: ConfirmModalProps) {
  
  // O conteúdo do modal que será renderizado fora da hierarquia do Drawer
  const modalContent = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.7)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle size={18} className={danger ? "text-destructive" : "text-accent"} />
            <h3
              style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", fontWeight: 700 }}
              className={danger ? "text-destructive" : "text-foreground"}
            >
              {title}
            </h3>
          </div>
        </div>

        <p className="text-muted-foreground text-sm mb-6" style={{ fontFamily: "'Inter', sans-serif" }}>
          {message}
        </p>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700 }}
          >
            CANCELAR
          </button>
          <button
            onClick={() => { onConfirm(); onClose(); }}
            className="flex-1 rounded-xl py-3 transition-all hover:opacity-90"
            style={{
              background: danger ? "linear-gradient(135deg, #ff3131, #cc0000)" : "linear-gradient(135deg, #ff5c00, #cc3300)",
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

  // Renderiza no final do body ou em um elemento raiz dedicado
  return createPortal(modalContent, document.body);
}