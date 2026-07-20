import { useState } from "react";
import type { AppPage } from "../types";
import { apiLogin, saveToken } from "../utils/api";
import { PasswordInput } from "../components/PasswordInput";

// Props para o componente LoginPage
interface LoginPageProps {
  onAuthSuccess: () => Promise<boolean>;
  setPage: (page: AppPage) => void;
  onBack: () => void;
}

export function LoginPage({ onAuthSuccess, setPage, onBack }: LoginPageProps) {

  // Estados para armazenar os valores dos campos, mensagens de erro, tentativas de login e bloqueio temporário
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState<number | null>(null);

  // Valida se o usuário pode tentar fazer login (nome preenchido e senha com 6 caracteres)
  const canLogin = name.trim() && password.length === 6;

  // Verifica se o usuário está temporariamente bloqueado devido a muitas tentativas de login
  const isBlocked = blockedUntil !== null && Date.now() < blockedUntil;

  // Função para lidar com o login do usuário, incluindo validação de tentativas e bloqueio temporário
  const handleLogin = async () => {
    if (isBlocked) {
      const remaining = Math.ceil((blockedUntil! - Date.now()) / 1000 / 60);
      setErrorMessage(`Muitas tentativas. Tente novamente em ${remaining} minuto(s).`);
      return;
    }

    // Limpa mensagens de erro e inicia o estado de carregamento
    setLoading(true);
    // Limpa mensagens de erro
    try {
      const token = await apiLogin(name, password);
      saveToken(token, rememberMe);
      setAttempts(0);
      setBlockedUntil(null);
      const success = await onAuthSuccess();
      if (success) {
        setPage({ tag: "home" });
      } else {
        setErrorMessage("Não foi possível carregar seus dados. Tente novamente.");
      }
    } catch (err: unknown) {
      // Incrementa o contador de tentativas e verifica se o usuário deve ser bloqueado
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      // Se o usuário exceder 5 tentativas, bloqueia por 5 minutos
      if (newAttempts >= 5) {
        setBlockedUntil(Date.now() + 5 * 60 * 1000);
        setErrorMessage("Muitas tentativas. Tente novamente em 5 minutos.");
      } else {
        // Mostra mensagem de erro com o número de tentativas restantes
        setErrorMessage(`Nome ou senha incorretos. Tentativa ${newAttempts} de 5.`);
      }
      // Limpa a senha para segurança
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col justify-center min-h-[70vh] pb-14">
      {loading ? (
        /* Splash Screen exibido durante o processo de Login */
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
          <p className="text-muted-foreground text-sm mt-4 animate-pulse" style={{ fontFamily: "'Inter', sans-serif" }}>
            Entrando e carregando seus dados...
          </p>
        </div>
      ) : (
        /* Formulário de Login Padrão */
        <>
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
              <label htmlFor="username" className="text-muted-foreground text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
                Nome
              </label>
              <input
                type="text"
                id="username"
                name="username"
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
                label="Senha"
                value={password}
                onChange={setPassword}
                placeholder="Sua senha"
              />
            </div>
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
                ENTRAR
              </span>
            </button>
            <button
              onClick={onBack}
              className="w-full rounded-xl py-4 flex items-center justify-center border border-border text-muted-foreground hover:text-foreground hover:border-primary/30 transition-all"
            >
              Voltar
            </button>
          </div>
        </>
      )}
    </div>
  );
}