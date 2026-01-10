import { Component, AfterViewInit, OnDestroy, inject, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VkAuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window { 
    VKIDSDK?: any;
  }
}

@Component({
  selector: 'app-floating-one-tap',
  standalone: true,
  imports: [CommonModule],
  template: ``, // FloatingOneTap рендерится динамически
})
export class FloatingOneTapComponent implements AfterViewInit, OnDestroy {
  private auth = inject(VkAuthService);
  private showTimer: any;
  private checkAuthInterval: any;
  private isRendered = false;
  private floatingOneTap: any = null;

  constructor() {
    // Отслеживаем изменения авторизации через effect
    effect(() => {
      const isAuthenticated = this.auth.isAuthenticated();
      // Если пользователь авторизовался и FloatingOneTap показан, закрываем его
      if (isAuthenticated && this.floatingOneTap && this.isRendered) {
        try {
          this.floatingOneTap.close();
          this.isRendered = false;
        } catch (error) {
          console.warn('Ошибка при закрытии FloatingOneTap:', error);
        }
      }
    });
  }

  ngAfterViewInit() {
    // Показываем FloatingOneTap через 10 секунд, если пользователь не авторизован
    this.checkAuthAndInit();
  }

  ngOnDestroy() {
    if (this.showTimer) {
      clearTimeout(this.showTimer);
    }
    if (this.checkAuthInterval) {
      clearInterval(this.checkAuthInterval);
    }
    if (this.floatingOneTap) {
      try {
        this.floatingOneTap.close();
      } catch (error) {
        console.warn('Ошибка при закрытии FloatingOneTap:', error);
      }
    }
  }

  private checkAuthAndInit() {
    // Если пользователь уже авторизован, не показываем FloatingOneTap
    if (this.auth.isAuthenticated()) {
      return;
    }

    // Показываем FloatingOneTap через 30 секунд
    this.showTimer = setTimeout(() => {
      if (!this.auth.isAuthenticated() && !this.isRendered) {
        this.initFloatingOneTap();
      }
    }, 30000); // 30 секунд
  }

  private initFloatingOneTap() {
    // Проверяем загрузку SDK
    if (!('VKIDSDK' in window)) {
      console.warn('VK ID SDK не загружен для FloatingOneTap');
      return;
    }

    if (!environment.vkAppId) {
      console.warn('VK App ID не настроен');
      return;
    }

    const VKID = window.VKIDSDK;

    try {
      // Инициализация конфигурации (используем ту же, что и в обычном OneTap)
      const redirectUrl = environment.vkRedirectUrl || window.location.origin;
      let finalRedirectUrl = redirectUrl;
      
      // Убираем завершающий слеш
      if (finalRedirectUrl.length > 1 && finalRedirectUrl.endsWith('/')) {
        finalRedirectUrl = finalRedirectUrl.slice(0, -1);
      }

      VKID.Config.init({
        app: Number(environment.vkAppId),
        redirectUrl: finalRedirectUrl,
        responseMode: VKID.ConfigResponseMode?.Callback || 'callback',
        source: VKID.ConfigSource?.LOWCODE || 'lowcode',
        scope: '',
      });

      // Создание FloatingOneTap
      if (typeof VKID.FloatingOneTap !== 'function') {
        console.warn('VKID.FloatingOneTap не доступен');
        return;
      }

      this.floatingOneTap = new VKID.FloatingOneTap();

      // Рендеринг FloatingOneTap
      this.floatingOneTap.render({
        scheme: 'dark', // или 'light' в зависимости от темы
        contentId: 1,
        appName: 'Finance Tracker',
        showAlternativeLogin: true
      })
      .on(VKID.WidgetEvents?.ERROR || 'error', (error: any) => {
        // Обработка ошибок
        if (error?.code === 2 || error?.text === 'New tab has been closed') {
          console.log('ℹ️ Пользователь закрыл окно авторизации (FloatingOneTap)');
          return;
        }
        console.error('FloatingOneTap error:', error);
      })
      .on(VKID.FloatingOneTapInternalEvents?.LOGIN_SUCCESS || 'login_success', (payload: any) => {
        console.log('FloatingOneTap LOGIN_SUCCESS:', payload);
        const code = payload.code;
        const deviceId = payload.device_id;

        if (!code) {
          console.error('Код авторизации не получен из payload');
          return;
        }

        // Обмен кода на токен
        if (VKID.Auth && typeof VKID.Auth.exchangeCode === 'function') {
          VKID.Auth.exchangeCode(code, deviceId)
            .then((tokenData: any) => {
              // Проверяем ошибки расширений браузера
              if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.lastError) {
                const lastError = chrome.runtime.lastError.message;
                if (lastError && !lastError.includes('message port closed')) {
                  console.warn('Chrome runtime error (ignored):', lastError);
                }
              }
              
              console.log('FloatingOneTap auth success:', tokenData);
              // Закрываем FloatingOneTap после успешной авторизации
              if (this.floatingOneTap) {
                this.floatingOneTap.close();
              }
              // Передаем данные в сервис для обработки
              this.auth.handleLoginSuccess({
                code,
                device_id: deviceId,
                ...tokenData
              });
            })
            .catch((error: any) => {
              // Игнорируем ошибки расширений браузера
              const errorMessage = error?.message || error?.toString() || '';
              if (
                errorMessage.includes('runtime.lastError') ||
                errorMessage.includes('message port closed') ||
                errorMessage.includes('Extension context invalidated') ||
                errorMessage.includes('The message port closed before a response was received')
              ) {
                // Это ошибка расширения, не критическая - продолжаем работу
                console.warn('Игнорируем ошибку расширения браузера:', errorMessage);
                // Пробуем передать payload напрямую, возможно токен уже есть
                this.auth.handleLoginSuccess(payload);
                return;
              }
              
              console.error('FloatingOneTap exchange code error:', error);
            });
        } else {
          console.error('VKID.Auth.exchangeCode не доступен');
          // Передаем payload напрямую, возможно токен уже есть
          this.auth.handleLoginSuccess(payload);
        }
      });

      this.isRendered = true;
      console.log('✅ FloatingOneTap отрендерен');

    } catch (error: any) {
      console.error('Ошибка инициализации FloatingOneTap:', error);
    }
  }
}

