import { useEffect } from "react";
import { X, ShieldCheck } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

// Props para o componente TermsModal
interface TermsModalProps {
  onAccept: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function TermsModal({ onAccept, onClose, loading = false }: TermsModalProps) {
  // Efeito para bloquear o scroll do body quando o modal está aberto
  useEffect(() => {
    // Bloqueia o scroll do body quando o modal é montado
    document.body.style.overflow = "hidden";
    // Restaura o scroll quando o modal é fechado (desmontado)
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      style={{ background: "rgba(0,0,0,0.8)", backdropFilter: "blur(4px)" }}
    >
      <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 flex flex-col gap-4 max-h-[90vh] min-h-[250px] justify-center">
        {loading ? (
          /* Splash Screen exibido após clicar em Aceitar */
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <p className="text-muted-foreground text-sm mt-4 animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>
              Criando sua conta...
            </p>
          </div>
        ) : (
          /* Conteúdo normal dos Termos de Uso */
          <>
            {/* Cabeçalho */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck size={18} className="text-primary" />
                <h3
                  style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.3rem", fontWeight: 700 }}
                  className="text-foreground"
                >
                  TERMOS DE USO
                </h3>
              </div>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                    <X size={18} />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>Fechar</span>
                </TooltipContent>
              </Tooltip>
            </div>

            {/* Conteúdo com scroll */}
            <div
              className="overflow-y-auto flex-1 pr-2 space-y-4 text-sm text-muted-foreground"
              style={{ fontFamily: "'Inter', sans-serif", maxHeight: "50vh" }}
            >
              <p className="text-foreground font-semibold">
                Antes de continuar, leia e aceite os termos abaixo.
              </p>

              <div>
                <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">1. Dados Coletados</p>
                <p>
                  O FlowHeart coleta dados de saúde como pressão arterial, frequência cardíaca, distância e duração dos treinos.
                  Estes são dados sensíveis conforme a LGPD (Lei nº 13.709/2018).
                </p>
              </div>

              <div>
                <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">2. Finalidade</p>
                <p>
                  Os dados são utilizados exclusivamente para exibição de estatísticas e relatórios pessoais.
                  Não compartilhamos suas informações com terceiros.
                </p>
              </div>

              <div>
                <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">3. Seus Direitos (LGPD)</p>
                <ul className="list-disc ml-4 mt-1 space-y-1">
                  <li>Acessar seus dados a qualquer momento</li>
                  <li>Exportar seus dados em formato PDF</li>
                  <li>Solicitar a exclusão total de seus dados</li>
                  <li>Revogar o consentimento a qualquer momento</li>
                </ul>
              </div>

              <div>
                <p className="text-foreground text-xs font-semibold uppercase tracking-widest mb-1">4. Armazenamento</p>
                <p>
                  Seus dados são armazenados de forma segura em banco de dados criptografado.
                  As senhas são protegidas com hash bcrypt e nunca armazenadas em texto puro.
                </p>
              </div>
            </div>

            {/* Botões */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl py-3 border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700 }}
              >
                RECUSAR
              </button>
              <button
                onClick={onAccept}
                className="flex-1 rounded-xl py-3 bg-primary text-primary-foreground hover:opacity-90 transition-all"
                style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1rem", fontWeight: 700 }}
              >
                ACEITAR
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}