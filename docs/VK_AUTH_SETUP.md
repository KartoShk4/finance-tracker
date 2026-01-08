# Настройка авторизации через ВКонтакте

## Описание

Приложение использует прямой OAuth flow через ВКонтакте API, без использования встроенной авторизации Supabase. Это позволяет использовать ВКонтакте для авторизации даже если Supabase не поддерживает этот провайдер напрямую.

## Шаг 1: Создание приложения в ВКонтакте

1. Перейдите на [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage)
2. Нажмите "Создать приложение"
3. Выберите тип приложения: **"Веб-сайт"**
4. Заполните название приложения (например: "Finance Tracker")
5. После создания приложения:
   - Скопируйте **ID приложения** (Application ID) - это число вида `12345678`
   - Перейдите в "Настройки" → "Безопасность"
   - Скопируйте **Секретный ключ** (Secret Key)
   - В разделе "Настройки" → "Базовый URI" укажите ваш домен:
     - Для разработки: `http://localhost:4200`
     - Для продакшена: `https://yourdomain.com`
   - В разделе "Настройки" → "Доверенный redirect URI" добавьте:
     - `http://localhost:4200/auth/callback` (для разработки)
     - `https://yourdomain.com/auth/callback` (для продакшена)

## Шаг 2: Настройка в приложении

### Для разработки (локально)

1. Откройте файл `src/environments/environment.ts`
2. Добавьте ваши данные ВКонтакте:

```typescript
export const environment = {
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-supabase-key',
  vkAppId: '12345678', // Ваш ID приложения ВКонтакте
  vkAppSecret: 'your-secret-key' // Ваш секретный ключ ВКонтакте
};
```

### Для продакшена (GitHub Pages)

Файл `src/environments/environment.prod.ts` уже создан и будет использоваться автоматически при production build.

**⚠️ ВАЖНО:** 
- Если ваш репозиторий **публичный**, не коммитьте реальные секретные ключи в `environment.prod.ts`!
- Используйте GitHub Secrets (см. инструкцию в `docs/GITHUB_PAGES_DEPLOY.md`)
- Или сделайте репозиторий **приватным**

## Шаг 3: Создание таблицы users в Supabase (опционально)

Для хранения данных пользователей создайте таблицу в Supabase:

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vk_id TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  photo TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Индекс для быстрого поиска по VK ID
CREATE INDEX idx_users_vk_id ON users(vk_id);

-- RLS политика (если нужно ограничить доступ)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Разрешаем всем читать и писать (настройте под свои нужды)
CREATE POLICY "Allow all operations on users" ON users
  FOR ALL USING (true) WITH CHECK (true);
```

## Шаг 4: Проверка работы

1. Запустите приложение: `npm start`
2. Нажмите кнопку "Войти через ВК" в шапке приложения
3. Должно произойти перенаправление на страницу авторизации ВКонтакте
4. После успешной авторизации вы будете перенаправлены обратно в приложение
5. В шапке должно отобразиться ваше имя из ВКонтакте

## Как это работает

1. **Инициация авторизации**: При нажатии кнопки "Войти через ВК" пользователь перенаправляется на страницу авторизации ВКонтакте
2. **Callback обработка**: После авторизации ВКонтакте перенаправляет пользователя обратно на `/auth/callback` с кодом авторизации
3. **Обмен кода на токен**: Приложение обменивает код на access token через API ВКонтакте
4. **Получение данных пользователя**: Используя токен, приложение получает информацию о пользователе через VK API
5. **Сохранение данных**: Данные пользователя сохраняются в localStorage и опционально в Supabase

## Безопасность

- Токен доступа хранится в localStorage с указанием времени истечения
- Используется параметр `state` для защиты от CSRF атак
- Секретный ключ приложения хранится только на клиенте (для продакшена рекомендуется использовать backend proxy)

## Полезные ссылки

- [Документация ВКонтакте OAuth](https://dev.vk.com/ru/api/access-token/authcode-flow-user)
- [Документация VK API](https://dev.vk.com/ru/api/overview)

## Troubleshooting

### Ошибка "VK App ID не настроен"
- Убедитесь, что вы добавили `vkAppId` и `vkAppSecret` в `environment.ts`

### Ошибка "Invalid redirect_uri"
- Проверьте, что в настройках приложения ВКонтакте указан правильный redirect URI
- URI должен точно совпадать (включая протокол http/https и порт)

### Ошибка "Invalid client_secret"
- Убедитесь, что вы скопировали правильный секретный ключ из настроек приложения ВКонтакте
