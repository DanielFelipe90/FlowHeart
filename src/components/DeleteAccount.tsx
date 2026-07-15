import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";
import { ConfirmModal } from "./ConfirmModal";

// Props para o componente DeleteAccount
interface DeleteAccountProps {
  onDelete: () => void;
}

export function DeleteAccount({ onDelete }: DeleteAccountProps) {
  
  // Estado para controlar se o modal de confirmação de exclusão da conta está visível
  const [showModal, setShowModal] = useState(false);

  return (
    <>
      <div className="fixed bottom-6 left-0 w-full flex justify-center p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={() => setShowModal(true)}
              className="w-full max-w-sm rounded-xl py-4 flex items-center justify-center gap-2 text-destructive hover:brightness-175 transition-all"
            >
              <Trash2 size={16} />
            </button>
          </TooltipTrigger>
          <TooltipContent className="bg-destructive">
            <span>
              Excluir Conta
            </span>
          </TooltipContent>
        </Tooltip>
      </div>

      {showModal && (
        <ConfirmModal
          title="Excluir Conta"
          message="Tem certeza que deseja excluir seu perfil e todos os seus dados? Esta ação é permanente e não pode ser desfeita."
          confirmLabel="APAGAR TUDO"
          danger
          onConfirm={onDelete}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}