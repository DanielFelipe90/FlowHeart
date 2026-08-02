import type { FlowNotificationOptions } from "../types";

export async function showNotification(
    title: string,
    options?: FlowNotificationOptions
): Promise<void> {
    if (Notification.permission !== "granted") return;

    if ("serviceWorker" in navigator) {
        try {
            const registration = await navigator.serviceWorker.ready;
            await registration.showNotification(title, options);
            return;
        } catch {
            // SW não disponível — tenta a API clássica abaixo
        }
    }

    try {
        new Notification(title, options);
    } catch {
        // Silencia qualquer erro residual
    }
}