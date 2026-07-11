import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AppPage } from "../types";
import { apiLogin, saveToken } from "../utils/api";

interface LoginPageProps {
  setUserName: (name: string) => void;
  setPage: (page: AppPage) => void;
  onBack: () => void;
}

function PasswordInput({ value, onChange, placeholder, id }: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  id: string; // adiciona
}) {
  const [show, setShow] = useState(false);
  return (
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
      <button
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}

export function LoginPage({ setUserName, setPage, onBack }: LoginPageProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  const canLogin = name.trim() && password.length === 6;
  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

  const handleLogin = async () => {
    if (isBlocked) {
      const remaining = Math.ceil((blockedUntil! - Date.now()) / 1000 / 60);
      setErrorMessage(`Muitas tentativas. Tente novamente em ${remaining} minuto(s).`);
      return;
    }

    setLoading(true);
    try {
      const token = await apiLogin(name, password);
      saveToken(token, rememberMe);
      setAttempts(0);
      setBlockedUntil(null);
      setUserName(name);
      setPage({ tag: "home" });
    } catch (err: unknown) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      if (newAttempts >= 5) {
        setBlockedUntil(Date.now() + 5 * 60 * 1000);
        setErrorMessage("Muitas tentativas. Tente novamente em 5 minutos.");
      } else {
        setErrorMessage(`Nome ou senha incorretos. Tentativa ${newAttempts} de 5.`);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[70vh] pb-14">
      <div className="mb-8">
        <h1
          className="text-foreground"
          style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem", fontWeight: 800, lineHeight: 1.05 }}
        >
          <span className="text-primary">FLOW</span>
          <span className="text-destructive">HEART</span>
          <br /><br />
          ENTRAR NA CONTA...
        </h1>
        <p className="text-muted-foreground mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Insira seus dados para continuar.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-muted-foreground text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
            Nome
          </label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
            className="w-full rounded-xl border border-border bg-input-background px-4 py-3 text-foreground outline-none focus:border-primary transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div>
          <label htmlFor="password" className="text-muted-foreground text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
            Senha
          </label>
          <PasswordInput id="password" value={password} onChange={setPassword} placeholder="Sua senha" />        </div>

        {/* Lembrar de mim */}
        <button
          onClick={() => setRememberMe((v) => !v)}
          className="flex items-center gap-3 w-full"
        >
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? "border-primary bg-primary" : "border-primary/30 bg-transparent"
            }`}>
            {rememberMe && <span className="text-primary-foreground text-xs font-bold">✓</span>}
          </div>
          <span className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Lembrar de mim
          </span>
        </button>

        {errorMessage && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 flex items-center justify-between">
            <p className="text-destructive text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {errorMessage}
            </p>
            <button onClick={() => setErrorMessage("")} className="text-destructive hover:opacity-70 transition-opacity ml-3">
              ✕
            </button>
          </div>
        )}

        <button
          disabled={!canLogin || loading || isBlocked}
          onClick={handleLogin}
          className="w-full rounded-xl py-4 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-primary text-primary-foreground"
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            {loading ? "ENTRANDO..." : "ENTRAR"}
          </span>
        </button>

        <button
          onClick={onBack}
          className="w-full rounded-xl py-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}