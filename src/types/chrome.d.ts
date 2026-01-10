/**
 * Типизация для Chrome Extension API
 * Используется для подавления ошибок расширений браузера
 */
declare global {
  const chrome: {
    runtime?: {
      lastError?: {
        message?: string;
      };
    };
  } | undefined;
}

export {};

