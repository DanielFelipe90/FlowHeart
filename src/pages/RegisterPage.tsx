import { useState } from "react";
import type { AppPage } from "../types";
import { apiRegister, saveToken } from "../utils/api";
import { PasswordInput } from "../components/PasswordInput";
import { TermsModal } from "../components/TermsModal";

interface RegisterPageProps {
  setUserName: (name: string) => void;
  setPage: (page: AppPage) => void;
  onBack: () => void;
}

export function RegisterPage({ setUserName, setPage, onBack }: RegisterPageProps) {
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const canRegister = name.trim() && password.length === 6 && confirmPassword.length === 6;

  // Função centralizada para realizar o registro
  const handleRegister = async () => {
    setErrorMessage("");
    setLoading(true);
    try {
      const token = await apiRegister(name, password);
      saveToken(token, rememberMe);
      setUserName(name);
      setPage({ tag: "home" });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : "Erro ao registrar");
      setShowTerms(false);
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
          CRIE SUA CONTA...
        </h1>
        <p className="text-muted-foreground mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Preencha os dados para criar sua conta,
          <br />e comece a registrar seus treinos.
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
          <PasswordInput
            id="password"
            label="Senha (6 caracteres)"
            value={password}
            onChange={setPassword}
            placeholder="6 letras ou números"
          />
        </div>

        <div>
          <PasswordInput
            id="confirmPassword"
            label="Confirmar Senha"
            value={confirmPassword}
            onChange={setConfirmPassword}
            placeholder="Repita a senha"
          />
        </div>

        <button
          onClick={() => setRememberMe((v) => !v)}
          className="flex items-center gap-3 w-full"
        >
          <div className={`w-5 h-5 rounded border flex items-center justify-center transition-all ${rememberMe ? "border-primary bg-primary" : "border-primary/30 bg-transparent"}`}>
            {rememberMe && <span className="text-primary-foreground text-xs font-bold">✓</span>}
          </div>
          <span className="text-muted-foreground text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
            Lembrar de mim
          </span>
        </button>

        {errorMessage && (
          <p className="text-destructive text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
            {errorMessage}
          </p>
        )}

        <button
          disabled={!canRegister || loading}
          onClick={() => {
            if (password !== confirmPassword) {
              setErrorMessage("As senhas não coincidem.");
              return;
            }
            setShowTerms(true);
          }}
          className="w-full rounded-xl py-4 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 bg-primary text-primary-foreground"
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            {loading ? "CRIANDO..." : "CRIAR CONTA"}
          </span>
        </button>

        <button
          onClick={onBack}
          className="w-full rounded-xl py-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
        >
          Voltar
        </button>
      </div>

      {showTerms && (
        <TermsModal
          onAccept={handleRegister}
          onClose={() => setShowTerms(false)}
        />
      )}
    </div>
  );
}