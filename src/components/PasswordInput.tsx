import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "./ui/tooltip";

interface PasswordInputProps {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string;
  label?: string; // Opcional, caso queira passar o label junto
}

export function PasswordInput({ value, onChange, placeholder, id, label }: PasswordInputProps) {
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