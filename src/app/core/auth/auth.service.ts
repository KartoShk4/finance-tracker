import { Injectable, signal, computed } from '@angular/core';
import { SupabaseService } from '../supabase/supabase.service';
import { environment } from '../../../environments/environment';

export interface VKUser {
  id: string;
  firstName: string;
  lastName: string;
  photo?: string;
  email?: string;
}

declare global {
  interface Window {
    VKIDSDK?: any;
    VKID?: any;
  }
}

@Injectable({ providedIn: 'root' })
export class VkAuthService {
  private readonly _user = signal<VKUser | null>(null);
  private readonly _loading = signal<boolean>(false);
  private readonly STORAGE_KEY = 'vk_user_data';
  private readonly TOKEN_KEY = 'vk_access_token';

  readonly user = computed(() => this._user());
  readonly isAuthenticated = computed(() => !!this._user());
  readonly loading = computed(() => this._loading());

  constructor(private supabase: SupabaseService) {
    this.init();
  }

  private init() {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    if (stored) {
      try {
        this._user.set(JSON.parse(stored));
      } catch (error) {
        console.error('Ошибка при загрузке данных пользователя из localStorage:', error);
        localStorage.removeItem(this.STORAGE_KEY);
      }
    }
  }

  async handleLoginSuccess(payload: any) {
    this._loading.set(true);
    
    try {
      console.log('VK login payload:', payload);

      // После exchangeCode payload содержит access_token, user_id и id_token (JWT)
      if (payload.access_token && payload.user_id) {
        // Сохраняем токен
        localStorage.setItem(this.TOKEN_KEY, payload.access_token);
        
        // Пробуем получить данные пользователя из id_token (JWT), если он есть
        if (payload.id_token) {
          try {
            const userData = this.parseIdToken(payload.id_token);
            if (userData) {
              await this.saveUserData(userData);
              return;
            }
          } catch (error) {
            console.warn('Не удалось распарсить id_token, используем VK API:', error);
          }
        }
        
        // Если id_token не доступен, получаем данные через VK API (с JSONP для обхода CORS)
        await this.fetchUserData({
          access_token: payload.access_token,
          user_id: payload.user_id
        });
        return;
      }

      // Если payload уже содержит данные пользователя
      if (payload.user) {
        const user: VKUser = {
          id: payload.user.id?.toString() || payload.userId?.toString() || '',
          firstName: payload.user.first_name || payload.user.firstName || '',
          lastName: payload.user.last_name || payload.user.lastName || '',
          photo: payload.user.photo_200 || payload.user.photo || undefined,
          email: payload.user.email || payload.email || undefined,
        };

        if (!user.id || !user.firstName) {
          throw new Error('Не удалось получить полные данные пользователя');
        }

        // Сохраняем токен, если он есть
        if (payload.access_token || payload.token) {
          localStorage.setItem(this.TOKEN_KEY, payload.access_token || payload.token);
        }

        await this.saveUserData(user);
        return;
      }

      // Если есть токен напрямую
      if (payload.token && payload.userId) {
        localStorage.setItem(this.TOKEN_KEY, payload.token);
        await this.fetchUserData({ access_token: payload.token, user_id: payload.userId });
        return;
      }

      throw new Error('Не удалось обработать данные авторизации. Отсутствуют токен или user_id');

    } catch (error: any) {
      console.error('VK login error:', error);
      alert(error.message || 'Ошибка при авторизации через ВКонтакте');
    } finally {
      this._loading.set(false);
    }
  }

  private async exchangeCodeForToken(code: string, deviceId?: string): Promise<any> {
    const VKID = window.VKIDSDK || window.VKID;
    
    if (!VKID || !VKID.Auth) {
      throw new Error('VK ID SDK не загружен');
    }

    try {
      // Используем VKID SDK для обмена кода на токен
      const tokenData = await VKID.Auth.exchangeCode(code, deviceId);
      
      if (!tokenData?.access_token || !tokenData?.user_id) {
        throw new Error('Не удалось получить токен доступа');
      }

      localStorage.setItem(this.TOKEN_KEY, tokenData.access_token);
      return tokenData;

    } catch (error: any) {
      console.error('Ошибка обмена кода на токен:', error);
      throw new Error('Не удалось обменять код на токен доступа');
    }
  }

  /**
   * Парсит JWT id_token для получения данных пользователя
   * Это обходит проблему CORS при запросе к VK API
   */
  private parseIdToken(idToken: string): VKUser | null {
    try {
      // JWT состоит из трех частей, разделенных точками: header.payload.signature
      const parts = idToken.split('.');
      if (parts.length !== 3) {
        console.error('Неверный формат JWT токена');
        return null;
      }

      // Декодируем payload (вторая часть)
      let payload = parts[1];
      
      // JWT использует base64url encoding
      // Добавляем padding если нужно
      while (payload.length % 4) {
        payload += '=';
      }
      
      // Заменяем символы base64url на base64
      payload = payload.replace(/-/g, '+').replace(/_/g, '/');
      
      // Декодируем
      const decodedPayload = atob(payload);
      const userData = JSON.parse(decodedPayload);

      console.log('Данные из id_token:', userData);

      // Извлекаем данные пользователя из токена
      // VK ID использует стандартные JWT claims (sub, given_name, family_name) или свои поля
      const user: VKUser = {
        id: userData.sub || userData.user_id?.toString() || userData.id?.toString() || '',
        firstName: userData.given_name || userData.first_name || userData.firstName || '',
        lastName: userData.family_name || userData.last_name || userData.lastName || '',
        photo: userData.picture || userData.photo_200 || userData.photo || undefined,
        email: userData.email || undefined,
      };

      if (!user.id) {
        console.warn('Не найден user_id в id_token');
        return null;
      }

      // Если нет имени, используем минимальные данные
      if (!user.firstName) {
        user.firstName = 'Пользователь';
      }

      return user;
    } catch (error: any) {
      console.error('Ошибка парсинга id_token:', error);
      return null;
    }
  }

  /**
   * Получает данные пользователя через VK API используя JSONP для обхода CORS
   */
  private async fetchUserData(tokenData: { access_token: string; user_id: string | number }): Promise<void> {
    const userId = tokenData.user_id.toString();

    try {
      // Используем JSONP для обхода CORS
      const userInfoUrl = `https://api.vk.com/method/users.get?` +
        `user_ids=${userId}&fields=photo_200,email&` +
        `access_token=${tokenData.access_token}&v=5.199&callback=jsonp_callback_${Date.now()}`;

      // Создаем JSONP запрос
      const data = await this.jsonpRequest(userInfoUrl);

      if (data.error) {
        throw new Error(data.error.error_msg || 'Ошибка VK API');
      }

      if (!data.response || data.response.length === 0) {
        throw new Error('Не удалось получить данные пользователя');
      }

      const vkUser = data.response[0];
      const user: VKUser = {
        id: userId,
        firstName: vkUser.first_name || '',
        lastName: vkUser.last_name || '',
        photo: vkUser.photo_200 || undefined,
        email: vkUser.email || undefined,
      };

      await this.saveUserData(user);

    } catch (error: any) {
      console.error('Ошибка получения данных пользователя:', error);
      // Не бросаем ошибку, если есть хотя бы user_id, создаем минимальные данные
      if (userId) {
        const minimalUser: VKUser = {
          id: userId,
          firstName: 'Пользователь',
          lastName: '',
        };
        await this.saveUserData(minimalUser);
        console.warn('Сохранены минимальные данные пользователя из-за ошибки API');
      } else {
        throw new Error(error.message || 'Не удалось получить данные пользователя');
      }
    }
  }

  /**
   * Выполняет JSONP запрос для обхода CORS
   */
  private jsonpRequest(url: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const callbackName = `jsonp_callback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Создаем функцию обратного вызова
      (window as any)[callbackName] = (data: any) => {
        delete (window as any)[callbackName];
        document.body.removeChild(script);
        resolve(data);
      };

      // Создаем script элемент
      const script = document.createElement('script');
      script.src = url.replace('callback=jsonp_callback_', `callback=${callbackName}`);
      script.onerror = () => {
        delete (window as any)[callbackName];
        document.body.removeChild(script);
        reject(new Error('JSONP request failed'));
      };
      
      document.body.appendChild(script);
    });
  }

  private async saveUserData(user: VKUser): Promise<void> {
    // Сохраняем локально
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(user));
    this._user.set(user);

    // Сохраняем в Supabase (опционально)
    try {
      await this.saveUserToSupabase(user);
    } catch (error) {
      console.warn('Не удалось сохранить пользователя в Supabase:', error);
      // Не блокируем процесс, если Supabase недоступен
    }
  }

  private async saveUserToSupabase(user: VKUser) {
    try {
      const { error } = await this.supabase.client
        .from('users')
        .upsert({
          vk_id: user.id,
          first_name: user.firstName,
          last_name: user.lastName,
          photo: user.photo,
          email: user.email,
          updated_at: new Date().toISOString()
        }, { onConflict: 'vk_id' });

      if (error) {
        console.warn('Supabase upsert error:', error);
      }
    } catch (err) {
      console.warn('Error saving user to Supabase:', err);
    }
  }

  signOut() {
    localStorage.removeItem(this.STORAGE_KEY);
    localStorage.removeItem(this.TOKEN_KEY);
    this._user.set(null);
    
    // Можно также вызвать метод выхода из VK ID SDK
    const VKID = window.VKIDSDK || window.VKID;
    if (VKID?.Auth) {
      try {
        VKID.Auth.logout?.();
      } catch (error) {
        console.warn('Ошибка при выходе из VK ID:', error);
      }
    }
  }
}
