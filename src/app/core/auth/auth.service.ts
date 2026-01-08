import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

/**
 * Интерфейс пользователя ВКонтакте
 */
export interface VKUser {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  email?: string;
}

/**
 * Интерфейс токена доступа
 */
interface AccessToken {
  access_token?: string;
  expires_in?: number;
  user_id?: number;
  email?: string;
  error?: string;
  error_description?: string;
}

/**
 * Сервис для управления авторизацией через ВКонтакте (прямой OAuth flow)
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly _user = signal<VKUser | null>(null);
  private readonly _loading = signal<boolean>(true);
  private readonly STORAGE_KEY = 'vk_auth_data';
  private readonly VK_API_VERSION = '5.131';

  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly loading = computed(() => this._loading());

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {
    this.init();
  }

  /**
   * Инициализация - проверка сохраненной сессии
   */
  private async init(): Promise<void> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const authData = JSON.parse(stored);
        // Проверяем, не истек ли токен
        if (authData.expiresAt && new Date(authData.expiresAt) > new Date()) {
          this._user.set(authData.user);
          // Сохраняем пользователя в Supabase
          await this.saveUserToSupabase(authData.user, authData.accessToken);
        } else {
          // Токен истек, очищаем
          localStorage.removeItem(this.STORAGE_KEY);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      localStorage.removeItem(this.STORAGE_KEY);
    } finally {
      this._loading.set(false);
    }
  }

  /**
   * Вход через ВКонтакте (прямой OAuth flow)
   */
  async signInWithVK(): Promise<void> {
    try {
      const vkAppId = environment.vkAppId;
      if (!vkAppId) {
        throw new Error('VK App ID не настроен. Добавьте vkAppId в environment.ts');
      }

      const redirectUri = `${window.location.origin}/auth/callback`;
      const scope = 'email'; // Запрашиваем email
      const state = crypto.randomUUID(); // Защита от CSRF
      
      // Сохраняем state для проверки в callback
      sessionStorage.setItem('vk_oauth_state', state);

      // Формируем URL для авторизации ВКонтакте
      const authUrl = `https://oauth.vk.com/authorize?` +
        `client_id=${vkAppId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${scope}&` +
        `response_type=code&` +
        `state=${state}&` +
        `v=${this.VK_API_VERSION}`;

      // Перенаправляем на страницу авторизации ВКонтакте
      window.location.href = authUrl;
    } catch (error) {
      console.error('Error in signInWithVK:', error);
      throw error;
    }
  }

  /**
   * Обработка callback после OAuth авторизации
   */
  async handleAuthCallback(code: string, state: string): Promise<void> {
    try {
      // Проверяем state для защиты от CSRF
      const savedState = sessionStorage.getItem('vk_oauth_state');
      if (!savedState || savedState !== state) {
        throw new Error('Invalid state parameter');
      }
      sessionStorage.removeItem('vk_oauth_state');

      const vkAppId = environment.vkAppId;
      const vkAppSecret = environment.vkAppSecret;
      const redirectUri = `${window.location.origin}/auth/callback`;

      if (!vkAppId || !vkAppSecret) {
        throw new Error('VK App ID или Secret не настроены');
      }

      // Обмениваем код на токен доступа
      const tokenUrl = `https://oauth.vk.com/access_token?` +
        `client_id=${vkAppId}&` +
        `client_secret=${vkAppSecret}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `code=${code}`;

      const tokenResponse = await fetch(tokenUrl);
      const tokenData: AccessToken = await tokenResponse.json();

      if (tokenData.error || !tokenData.access_token) {
        throw new Error(tokenData.error_description || tokenData.error || 'Ошибка получения токена');
      }

      if (!tokenData.user_id) {
        throw new Error('Не удалось получить ID пользователя');
      }

      // Получаем информацию о пользователе
      const userInfoUrl = `https://api.vk.com/method/users.get?` +
        `user_ids=${tokenData.user_id}&` +
        `fields=photo_200&` +
        `access_token=${tokenData.access_token}&` +
        `v=${this.VK_API_VERSION}`;

      const userResponse = await fetch(userInfoUrl);
      const userData = await userResponse.json();

      if (userData.error) {
        throw new Error(userData.error.error_msg || 'Ошибка получения данных пользователя');
      }

      if (!userData.response || userData.response.length === 0) {
        throw new Error('Не удалось получить данные пользователя');
      }

      const vkUserData = userData.response[0];
      const user: VKUser = {
        id: tokenData.user_id!.toString(),
        firstName: vkUserData.first_name,
        lastName: vkUserData.last_name,
        photo: vkUserData.photo_200,
        email: tokenData.email
      };

      // Сохраняем данные в localStorage
      const expiresIn = tokenData.expires_in || 86400; // По умолчанию 24 часа
      const expiresAt = new Date(Date.now() + expiresIn * 1000);
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify({
        user,
        accessToken: tokenData.access_token,
        expiresAt: expiresAt.toISOString()
      }));

      this._user.set(user);

      // Сохраняем пользователя в Supabase
      await this.saveUserToSupabase(user, tokenData.access_token);
    } catch (error) {
      console.error('Error in handleAuthCallback:', error);
      throw error;
    }
  }

  /**
   * Сохранение пользователя в Supabase
   */
  private async saveUserToSupabase(user: VKUser, accessToken: string): Promise<void> {
    try {
      // Проверяем, существует ли таблица users, если нет - создаем запись через upsert
      const { error } = await this.supabase.client
        .from('users')
        .upsert({
          vk_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          photo: user.photo,
          email: user.email,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'vk_id'
        });

      if (error) {
        // Если таблицы нет, просто логируем ошибку (не критично)
        console.warn('Could not save user to Supabase:', error);
      }
    } catch (error) {
      console.warn('Error saving user to Supabase:', error);
    }
  }

  /**
   * Выход из системы
   */
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      this._user.set(null);
      this.router.navigate(['/']);
    } catch (error) {
      console.error('Error in signOut:', error);
      throw error;
    }
  }
}

