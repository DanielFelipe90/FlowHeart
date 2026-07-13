// Exemplo de como o componente InactivityModal deve ser:
export function InactivityModal({ isOpen, onKeepAlive }: { isOpen: boolean, onKeepAlive: () => void }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
                <h2 className="text-lg font-bold mb-4">Ainda está aí?</h2>
                <p className="mb-6">Sua sessão expirará em breve por inatividade.</p>
                {/* AQUI ESTÁ O USO: o onClick chama a função */}
                <button
                    onClick={onKeepAlive}
                    className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                    Continuar conectado
                </button>
            </div>
        </div>
    );
}