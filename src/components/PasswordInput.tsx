import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

// Props para o componente PasswordInput
interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
  label?: string; // Opcional, caso queira passar o label junto
  // "current-password" (login) ou "new-password" (cadastro/troca de senha) — são
  // tokens diferentes de propósito pro autofill: o primeiro sinaliza "preencher
  // com a senha salva", o segundo sinaliza "esse é um campo de senha NOVA, não
  // sugerir a antiga, e oferecer salvar essa como nova senha". Default cobre o
  // caso mais comum (telas de login).
  autoComplete?: "current-password" | "new-password";
}

export function PasswordInput({ value, onChange, placeholder, id, label, autoComplete = "current-password" }: PasswordInputProps) {

  // Estado para controlar se a senha está visível ou oculta
  const [show, setShow] = useState(false);

  return (
    <div>
      {label && (
        <label htmlFor={id} className="text-muted-foreground text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
          {label}
        </label>
      )}
      <div className="relative">
        <input
          id={id}
          name={id}
          type={show ? "text" : "password"}
          value={value}
          placeholder={placeholder}
          maxLength={6}
          autoComplete={autoComplete}
          onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
          className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-foreground outline-none focus:border-primary transition-all pr-10"
          style={{ fontFamily: "'Inter', sans-serif" }}
        />
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              {show ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </TooltipTrigger>
          <TooltipContent>
            <span>{show ? "Ocultar senha" : "Mostrar senha"}</span>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );
}