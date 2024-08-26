sap.ui.define(() => {

    const isProd = location.origin.startsWith('https://harelyshau.dev');
    const apiHost = isProd
        ? 'https://harelyshau-api.onrender.com'
        : 'http://localhost:3000';

    return {
        subscribe: async () => {
            const reg = await navigator.serviceWorker.getRegistration();
            if (await reg.pushManager.getSubscription()) return true;
            const applicationServerKey = isProd
                ? 'BAo7eqjJe07at8zLt4tB97KpD62Lv4TdTUTmdI8CZ5YyDIe-pwjDrMczltmCldqO9xPfQaOhf3pNS6gLFJb2zRg'
                : 'BEy6fJH3SAngYaCQF1Vsc44niGbFOrcf9qg3ENu_AH84lNSXe7gdnOd6-U_FcH3__XopXGLYkp5gpn4kYvREa-w';
            const sub = await reg.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey
            });
            
            return fetch(`${apiHost}/notifications/subscribe`, {
                method: 'POST',
                body: JSON.stringify(sub),
                headers: { 'Content-Type': 'application/json' }
            });
        },

        trigger: async (notification) => {
            if (!Notification) throw new Error('Please Add app to Home Screen');
            const perm = await Notification.requestPermission();
            const sError = 'Please enable notifications for this site in settings';
            if (perm !== 'granted') throw new Error(sError);
            return fetch(`${apiHost}/notifications`, {
                method: 'POST',
                body: JSON.stringify(notification),
                headers: { 'Content-Type': 'application/json' }
            });
        }
    }
});