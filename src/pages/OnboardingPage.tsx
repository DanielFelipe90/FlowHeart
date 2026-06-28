// src/pages/OnboardingPage.tsx

import type { AppPage } from "../app/App";

interface OnboardingPageProps {
  userName: string;
  setUserName: (name: string) => void;
  setPage: (page: AppPage) => void;
}

export function OnboardingPage({ userName, setUserName, setPage }: OnboardingPageProps) {
  return (
    <div className="flex flex-col justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-6 m-4">
        <img src="/icon.png" alt="FlowHeart" className="w-30 h-30 rounded-lg object-contain" />
      </div>

      <div className="mb-8">
        <h1
          style={{
            fontFamily: "'Barlow Condensed', sans-serif",
            fontSize: "2.5rem",
            fontWeight: 800,
            color: "#e8eaf0",
            lineHeight: 1.05,
          }}
        >
          BEM-VINDO AO<br />
          <span className="text-[#00e5ff]">FLOW</span>
          <span className="text-[#ff3131]">HEART</span>
        </h1>
        <p className="text-[#7a8099] mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Seu tracker de treino de ciclismo com monitoramento cardíaco.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="userName"
            className="text-[#7a8099] text-xs uppercase tracking-widest mb-2 block"
            style={{ fontFamily: "'Inter', sans-serif" }}
          >
            Como podemos te chamar?
          </label>
          <input
            id="userName"
            name="userName"
            type="text"
            autoComplete="name"
            placeholder="Seu nome"
            value={userName}
            onChange={(e) => {
              const onlyLetters = e.target.value.replace(/[^a-zA-ZÀ-ÿ\s]/g, "");
              setUserName(onlyLetters);
            }}
            className="w-full rounded-xl border border-[rgba(0,229,255,0.12)] bg-[#1e2330] px-4 py-3 text-[#e8eaf0] outline-none focus:border-[#00e5ff] transition-all"
            style={{ fontFamily: "'Inter', sans-serif" }}
          />
        </div>

        <button
          disabled={!userName.trim()}
          onClick={() => setPage({ tag: "home" })}
          className="w-full rounded-xl py-4 flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%)", color: "#0d0f14" }}
        >
          <span
            style={{
              fontFamily: "'Barlow Condensed', sans-serif",
              fontSize: "1.1rem",
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            COMEÇAR
          </span>
        </button>
      </div>
    </div>
  );
}