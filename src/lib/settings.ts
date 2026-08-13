/** Ses dosyaları eklendiğinde buradan çalınacak — şimdilik kapalı */
export function playMessageSound(_enabled: boolean, _volume: number) {}
export function playFriendSound(_enabled: boolean, _volume: number) {}
export function playNotificationSound(_enabled: boolean, _volume: number) {}

export { applyTheme, getTheme, isValidTheme, THEMES, THEME_IDS } from "./themes";
export type { Theme } from "./themes";
