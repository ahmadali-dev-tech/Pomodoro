/** Browser (system) notifications. Falls back silently; the Inbox always has the in-app copy. */
export const notificationsSupported = () => typeof window !== 'undefined' && 'Notification' in window

export const notificationPermission = () =>
  notificationsSupported() ? Notification.permission : 'unsupported'

export const requestNotificationPermission = async () => {
  if (!notificationsSupported()) return 'unsupported'
  if (Notification.permission !== 'default') return Notification.permission
  try {
    return await Notification.requestPermission()
  } catch {
    return Notification.permission
  }
}

export const showSystemNotification = (title, body) => {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  if (typeof document !== 'undefined' && !document.hidden) return
  try {
    new Notification(title, { body, tag: 'pomodoro-session' })
  } catch {
    /* Some mobile browsers only allow notifications from a service worker. */
  }
}
