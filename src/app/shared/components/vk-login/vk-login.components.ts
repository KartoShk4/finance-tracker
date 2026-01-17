import { Component, AfterViewInit, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VkAuthService } from '../../../core/auth/auth.service';
import { environment } from '../../../../environments/environment';

declare global {
  interface Window {
    VKIDSDK?: any;
  }
}

@Component({
  selector: 'app-vk-login',
  standalone: true,
  imports: [CommonModule],
  template: `<div #vkContainer></div>`,
})
export class VkLoginComponent implements AfterViewInit {
  @ViewChild('vkContainer', { static: false }) vkContainer!: ElementRef<HTMLDivElement>;

  constructor(private el: ElementRef, private auth: VkAuthService) {}

  ngAfterViewInit() {
    // Используем динамическую загрузку SDK, как в оригинале
    if ('VKIDSDK' in window) {
      // SDK уже загружен из index.html
      setTimeout(() => {
        this.initVk();
      }, 200);
    } else {
      // Загружаем SDK динамически
      this.loadSDK();
    }
  }

  private loadSDK() {
    // Проверяем, не загружается ли уже скрипт
    const existingScript = document.querySelector('script[src*="@vkid/sdk"]');
    if (existingScript) {
      // Скрипт уже есть, ждем его загрузки
      const checkSDK = setInterval(() => {
        if ('VKIDSDK' in window) {
          clearInterval(checkSDK);
          setTimeout(() => {
            this.initVk();
          }, 200);
        }
      }, 100);

      // Таймаут на случай, если скрипт не загрузится
      setTimeout(() => {
        clearInterval(checkSDK);
        if (!('VKIDSDK' in window)) {
          console.error('VK ID SDK не загружен после ожидания');
        }
      }, 10000);
      return;
    }

    // Загружаем скрипт
    const script = document.createElement('script');
    script.src = 'https://unpkg.com/@vkid/sdk@2/dist-sdk/umd/index.js';
    script.async = true;
    script.onload = () => {
      setTimeout(() => {
        this.initVk();
      }, 200);
    };
    script.onerror = () => {
      console.error('Ошибка загрузки VK ID SDK');
    };
    document.head.appendChild(script);
  }

  private initVk() {
    // Проверяем загрузку SDK (используем VKIDSDK как в оригинале)
    if (!('VKIDSDK' in window)) {
      console.error('VK ID SDK не загружен. Проверьте подключение скрипта в index.html');
      return;
    }

    if (!environment.vkAppId) {
      console.error('VK App ID не настроен в environment.ts');
      return;
    }

    const VKID = window.VKIDSDK;

    try {
      // Получаем контейнер - сначала пробуем ViewChild, затем через ElementRef
      let container = null;

      if (this.vkContainer?.nativeElement) {
        container = this.vkContainer.nativeElement;
      } else {
        // Fallback: ищем div в корневом элементе компонента
        container = this.el.nativeElement.querySelector('div');
      }

      if (!container) {
        console.error('Контейнер для VK OneTap не найден');
        console.error('ElementRef:', this.el.nativeElement);
        console.error('ViewChild:', this.vkContainer);
        return;
      }

      console.log('Контейнер найден, инициализация VK OneTap...');
      console.log('VKID SDK доступен:', !!VKID);
      console.log('VK App ID:', environment.vkAppId);

      // Инициализация конфигурации (как в оригинале)
      // Для OneTap redirectUrl должен совпадать с настройками приложения VK
      // ВАЖНО: redirectUrl должен точно совпадать с "Доверенный redirect URI" в настройках приложения VK
      const currentOrigin = window.location.origin;
      const currentPathname = window.location.pathname;

      // Для GitHub Pages нужно учитывать базовый путь (base href)
      // Если приложение размещено в подпапке (например, /finance-tracker/),
      // то redirectUrl может включать этот путь
      // Но обычно VK принимает redirectUrl без пути, только origin + базовый путь
      let redirectUrl = environment.vkRedirectUrl || '';

      // Очищаем URL от пробелов и лишних символов
      redirectUrl = redirectUrl.trim();

      // Если redirectUrl не указан в environment, используем текущий origin + базовый путь
      if (!redirectUrl) {
        // Определяем базовый путь из base href или pathname
        const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
        const basePath = baseHref !== '/' ? baseHref.replace(/\/$/, '') : '';
        redirectUrl = currentOrigin + basePath;
      }

      if (redirectUrl.length > 1 && redirectUrl.endsWith('/')) {
        redirectUrl = redirectUrl.slice(0, -1);
      }

      const isGitHubPages = currentOrigin.includes('github.io') && redirectUrl.includes(currentOrigin);
      if (currentOrigin !== redirectUrl && environment.vkRedirectUrl && environment.vkRedirectUrl !== currentOrigin && !isGitHubPages) {
      }

      try {
        const config: any = {
          app: Number(environment.vkAppId),
          redirectUrl: redirectUrl,
        };

        if (VKID.ConfigResponseMode && VKID.ConfigResponseMode.Callback) {
          config.responseMode = VKID.ConfigResponseMode.Callback;
        } else {
          // Если ConfigResponseMode не доступен, пробуем строковое значение
          config.responseMode = 'callback';
        }

        if (VKID.ConfigSource && VKID.ConfigSource.LOWCODE) {
          config.source = VKID.ConfigSource.LOWCODE;
        } else {
          // Если ConfigSource не доступен, пробуем строковое значение
          config.source = 'lowcode';
        }

        config.scope = ''; // Заполните нужными доступами по необходимости (email, phone и т.д.)

        VKID.Config.init(config);
      } catch (configError: any) {
        console.error('❌ Ошибка инициализации Config:', configError);
        console.error('Детали ошибки:', {
          message: configError.message,
          code: configError.code,
          redirectUrl: redirectUrl
        });

        // Показываем более информативное сообщение об ошибке
        const errorMsg = configError.message || JSON.stringify(configError);
        if (errorMsg.includes('redirect_uri') || errorMsg.includes('redirect')) {
          alert(`Ошибка redirect URI!\n\n` +
            `Текущий redirectUrl: ${redirectUrl}\n` +
            `Текущий origin: ${currentOrigin}\n\n` +
            `Убедитесь, что в настройках приложения VK (раздел "Доверенный redirect URI") указан:\n${redirectUrl}\n\n` +
            `Ошибка: ${errorMsg}`);
        } else {
          alert('Ошибка инициализации VK ID SDK: ' + errorMsg);
        }
        return; // Не продолжаем, если конфигурация не инициализирована
      }

      // Создание OneTap виджета (как в оригинале)
      if (typeof VKID.OneTap !== 'function') {
        console.error('VKID.OneTap не является функцией. Доступные свойства:', Object.keys(VKID));
        return;
      }

      const oneTap = new VKID.OneTap();
      console.log('OneTap создан');

      // Рендеринг виджета с параметрами
      try {
        oneTap.render({
          container: container,
          fastAuthEnabled: false,
          showAlternativeLogin: true
        })
        .on(VKID.WidgetEvents?.ERROR || 'error', (error: any) => {
          // Обработка ошибок VK ID SDK
          // Код 2 означает, что пользователь закрыл окно авторизации - это не критическая ошибка
          if (error?.code === 2 || error?.text === 'New tab has been closed') {
            console.log('ℹ️ Пользователь закрыл окно авторизации');
            // Не показываем ошибку пользователю, так как это его действие
            return;
          }

          // Показываем alert только для критических ошибок (не для закрытия окна)
          if (error?.code !== 2) {
            const errorMessage = error?.text || error?.message || JSON.stringify(error);
            if (errorMessage && !errorMessage.includes('closed')) {
              console.warn('⚠️ Ошибка VK ID SDK:', errorMessage);
              // Не показываем alert для некритических ошибок, только логируем
            }
          }
        })
        .on(VKID.OneTapInternalEvents?.LOGIN_SUCCESS || 'login_success', (payload: any) => {
          console.log('OneTap LOGIN_SUCCESS:', payload);
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

                console.log('VKID auth success:', tokenData);
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

                console.error('VKID exchange code error:', error);
                alert('Ошибка при обмене кода на токен: ' + (error.message || error));
              });
          } else {
            console.error('VKID.Auth.exchangeCode не доступен');
            // Передаем payload напрямую, возможно, токен уже есть
            this.auth.handleLoginSuccess(payload);
          }
        });

        console.log('OneTap виджет отрендерен');
      } catch (renderError) {
        console.error('Ошибка рендеринга OneTap:', renderError);
      }

    } catch (error: any) {
      console.error('Ошибка инициализации VK ID SDK:', error);
      console.error('VKIDSDK object:', window.VKIDSDK);
    }
  }
}
