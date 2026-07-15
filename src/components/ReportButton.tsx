import { useState } from "react";
import { FileDown, Loader2 } from "lucide-react";

// Props para o componente ReportButton
interface ReportButtonProps {
  onGenerate: () => Promise<void>;
  disabled?: boolean;
  label?: string;
}

/**
 * ReportButton — Botão reutilizável para geração de relatórios.
 * Exibe loading durante a geração e trata erros.
 * Pode ser usado em qualquer página que precise gerar um relatório.
 */
export function ReportButton({ onGenerate, disabled = false, label = "Exportar PDF" }: ReportButtonProps) {
  // Estado para controlar o loading e mensagens de erro
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Função que lida com o clique no botão, chamando a função de geração de relatório
  const handleClick = async () => {
    setLoading(true);
    setError("");
    try {
      await onGenerate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro ao gerar relatório");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={handleClick}
        disabled={disabled || loading}
        className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-muted-foreground hover:text-primary hover:border-primary/30 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {loading
          ? <Loader2 size={16} className="animate-spin" />
          : <FileDown size={16} />
        }
        <span style={{ fontFamily: "'Inter', sans-serif", fontSize: "0.85rem" }}>
          {loading ? "Gerando..." : label}
        </span>
      </button>
      {error && (
        <p className="text-destructive text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}