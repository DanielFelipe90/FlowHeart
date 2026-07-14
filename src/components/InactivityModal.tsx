export function InactivityModal({ isOpen, onKeepAlive }: { isOpen: boolean, onKeepAlive: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 backdrop-blur-sm">
            <div className="bg-card text-card-foreground p-6 rounded-lg shadow-xl text-center border border-border max-w-sm w-full mx-4">
                <h2 className="text-lg font-bold mb-4">Ainda está aí?</h2>
                <p className="mb-6 text-muted-foreground">Sua sessão expirará em breve por inatividade.</p>
                
                <button
                    onClick={onKeepAlive}
                    className="bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium transition-colors hover:opacity-90 active:scale-95"
                >
                    Continuar conectado
                </button>
            </div>
        </div>
    );
}