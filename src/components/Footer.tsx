export function Footer() {
  return (
    <footer
      className="fixed bottom-0 left-0 right-0 border-t border-[rgba(0,229,255,0.08)] py-3 text-center"
      style={{ background: "#0d0f14" }}
    >
      <p className="text-[#3a3f52] text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
        Todos os direitos reservados - FlowHeart © {new Date().getFullYear()}
      </p>
    </footer>
  );
}