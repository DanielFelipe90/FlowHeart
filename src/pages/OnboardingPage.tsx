import type { AppPage } from "../types";
import { isRegistered } from "../utils/storage";

interface OnboardingPageProps {
  setPage: (page: AppPage) => void;
}

export function OnboardingPage({ setPage }: OnboardingPageProps) {
  return (
    <div className="flex flex-col justify-center min-h-[70vh]">
      <div className="flex flex-col items-center gap-6 m-4">
        <img src="/icon.png" alt="FlowHeart" className="w-30 h-30 rounded-lg object-contain" />
      </div>

      <div className="mb-8">
        <h1 style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "2.5rem", fontWeight: 800, color: "#e8eaf0", lineHeight: 1.05 }}>
          BEM-VINDO AO<br />
          <span className="text-[#00e5ff]">FLOW</span>
          <span className="text-[#ff3131]">HEART</span>
        </h1>
        <p className="text-[#7a8099] mt-2 text-sm" style={{ fontFamily: "'Inter', sans-serif" }}>
          Seu tracker de treino de ciclismo com monitoramento cardíaco.
        </p>
      </div>

      <div className="space-y-3">
        <button
          onClick={() => setPage({ tag: "register" })}
          className="w-full rounded-xl py-4 flex items-center justify-center transition-all hover:opacity-90"
          style={{ background: "linear-gradient(135deg, #00e5ff 0%, #00b8cc 100%)", color: "#0d0f14" }}
        >
          <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
            REGISTRAR
          </span>
        </button>

        {isRegistered() && (
          <button
            onClick={() => setPage({ tag: "login" })}
            className="w-full rounded-xl py-4 flex items-center justify-center border border-[rgba(0,229,255,0.12)] text-[#7a8099] hover:text-[#e8eaf0] hover:border-[rgba(0,229,255,0.3)] transition-all"
          >
            <span style={{ fontFamily: "'Barlow Condensed', sans-serif", fontSize: "1.1rem", fontWeight: 700, letterSpacing: "0.05em" }}>
              ENTRAR
            </span>
          </button>
        )}
      </div>
    </div>
  );
}