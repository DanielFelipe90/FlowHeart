export function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-border py-3 text-center bg-background">
      <p className="text-muted-foreground text-xs" style={{ fontFamily: "'Inter', sans-serif" }}>
        Todos os direitos reservados - FlowHeart © {new Date().getFullYear()}
      </p>
    </footer>
  );
}