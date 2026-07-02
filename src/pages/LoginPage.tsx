import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import type { AppPage } from "../types";
import { loadPassword, loadUserName } from "../utils/storage";

interface LoginPageProps {
  setUserName: (name: string) => void;
  setPage: (page: AppPage) => void;
  onBack: () => void;
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? "text" : "password"}
        value={value}
        placeholder={placeholder}
        maxLength={6}
        onChange={(e) => onChange(e.target.value.replace(/[^a-zA-Z0-9]/g, ""))}
        className="w-full rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#1e2330] px-4 py-3 text-[#e8eaf0] outline-none focus:border-[#00e5ff] transition-all pr-10"
        style={{ fontFamily: "'Inter', sans-serif" }}
      />
      <button
        onClick={() => setShow((v) => !v)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7a8099] hover:text-[#e8eaf0] transition-colors"
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

  const canLogin = name.trim() && password.length === 6;

  const handleLogin = () => {
    const savedName = loadUserName();
    const savedPassword = loadPassword();

    if (name.toLowerCase() !== savedName.toLowerCase() || password !== savedPassword) {
      setErrorMessage("Nome ou senha incorretos.");
      return;
    }

    setUserName(savedName);
    setPage({ tag: "home" });
  };

  return (
    <div className="flex flex-col justify-center min-h-[70vh] pb-24">

      <div className="mb-8">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1.05 }}>
          <span className="text-[#00e5ff]">FLOW</span>
          <span className="text-[#ff3131]">HEART</span>
          <br />
          <br />
          ENTRAR
        </h1>
        <p className="text-[#7a8099] mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Insira seus dados para continuar.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-[#7a8099] text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
            Nome
          </label>
          <input
            type="text"
            autoComplete="name"
            placeholder="Digite seu nome"
            value={name}
            onChange={(e) => setName(e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, ""))}
            className="w-full rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#1e2330] px-4 py-3 text-[#e8eaf0] outline-none focus:border-[#00e5ff] transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <div>
          <label className="text-[#7a8099] text-xs uppercase tracking-widest mb-2 block" style={{ fontFamily: "'Inter', sans-serif" }}>
            Senha
          </label>
          <PasswordInput value={password} onChange={setPassword} placeholder="Sua senha" />
        </div>

        {/* Modal de erro inline */}
        {errorMessage && (
          <div className="rounded-xl border border-[#ff3131]/30 bg-[#ff3131]/10 p-4 flex items-center justify-between">
            <p className="text-[#ff3131] text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
              {errorMessage}
            </p>
            <button onClick={() => setErrorMessage("")} className="text-[#ff3131] hover:opacity-70 transition-opacity ml-3">
              ✕
            </button>
          </div>
        )}

        <button
          disabled={!canLogin}
          onClick={handleLogin}
          className="w-full rounded-xl py-4 flex items-center justify-center transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%)", color: "#0d0f14" }}
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            ENTRAR
          </span>
        </button>

        <button onClick={onBack} className="w-full rounded-xl py-4 flex items-center justify-center border border-[rgba(0,229,255,0.12)] text-[#7a8099] hover:text-[#e8eaf0] hover:border-[rgba(0,229,255,0.3)] transition-all">
          Voltar
        </button>
      </div>
    </div>
  );
}