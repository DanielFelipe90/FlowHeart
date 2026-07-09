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
      <div className="fixed bottom-6 left-0 w-full flex justify-center p-4">
        <button
          onClick={() => setShowModal(true)}
          className="w-full max-w-sm rounded-xl py-4 flex items-center justify-center gap-2 text-[#ff3131] hover:text-[#fd4d4d] transition-all border border-transparent"
        >
          <Trash2 size={16} />
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            Apagar Perfil
          </span>
        </button>
      </div>

      {showModal && (
        <ConfirmModal
          title="APAGAR CONTA"
          message="Tem certeza que deseja apagar seu perfil e todos os seus dados? Esta ação é permanente e não pode ser desfeita."
          confirmLabel="APAGAR TUDO"
          danger
          onConfirm={onDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}