/**
 * Global notification utility
 * This creates a singleton notification service that can be used throughout the app
 */

type NotificationSeverity = 'success' | 'error' | 'warning' | 'info';

interface NotificationCallback {
  (message: string, severity: NotificationSeverity): void;
}

class NotificationService {
  private callbacks: NotificationCallback[] = [];

  subscribe(callback: NotificationCallback): () => void {
    this.callbacks.push(callback);
    return () => {
      this.callbacks = this.callbacks.filter((cb) => cb !== callback);
    };
  }

  private notify(message: string, severity: NotificationSeverity): void {
    this.callbacks.forEach((callback) => callback(message, severity));
  }

  showSuccess(message: string): void {
    this.notify(message, 'success');
  }

  showError(message: string): void {
    this.notify(message, 'error');
  }

  showWarning(message: string): void {
    this.notify(message, 'warning');
  }

  showInfo(message: string): void {
    this.notify(message, 'info');
  }
}

export const notificationService = new NotificationService();
