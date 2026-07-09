import { useState } from "react";
import { Trash2 } from "lucide-react";
import { ConfirmModal } from "./ConfirmModal";

interface DeleteAccountProps {
  onDelete: () => void;
}

export function DeleteAccount({ onDelete }: DeleteAccountProps) {
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full rounded-xl py-4 flex items-center justify-center gap-2 border border-[#ff3131]/30 text-[#ff3131] hover:bg-[#ff3131]/10 transition-all"
      >
        <Trash2 size={16} />
        <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
          APAGAR CONTA
        </span>
      </button>

      {showModal && (
        <ConfirmModal
          title="APAGAR CONTA"
          message="Tem certeza que deseja apagar sua conta e todos os seus dados? Esta ação é permanente e não pode ser desfeita."
          confirmLabel="APAGAR TUDO"
          danger
          onConfirm={onDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}