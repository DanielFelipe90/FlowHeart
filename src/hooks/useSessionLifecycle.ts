import { useEffect } from 'react';
import { loadToken } from '../utils/api';

export function useSessionLifecycle() {
    useEffect(() => {
        const handlePageHide = () => {
            const token = loadToken();
            if (token) {
                // O backend exige que o JSON contenha a chave "token"
                const body = JSON.stringify({ token: token });
                const blob = new Blob([body], { type: 'application/json' });
                navigator.sendBeacon('http://localhost:8000/auth/logout', blob);
            }
        };
        window.addEventListener('pagehide', handlePageHide);
        return () => window.removeEventListener('pagehide', handlePageHide);
    }, []);
}