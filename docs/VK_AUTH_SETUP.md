# Настройка авторизации через ВКонтакте (VK OneTap)

## Описание

Приложение использует VK ID SDK для реализации авторизации через ВКонтакте с использованием OneTap (авторизация в одно касание). Это позволяет пользователям быстро авторизоваться без необходимости вводить данные вручную.

## Шаг 1: Создание приложения в ВКонтакте

1. Перейдите на [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage)
2. Нажмите "Создать приложение"
3. Выберите тип приложения: **"Веб-сайт"**
4. Заполните название приложения (например: "Finance Tracker")
5. После создания приложения:
   - Скопируйте **ID приложения** (Application ID) - это число вида `12345678`
   - Перейдите в "Настройки" → "Безопасность"
   - Скопируйте **Секретный ключ** (Secret Key)
   - В разделе "Настройки" → "Адрес сайта" укажите ваш домен:
     - Для разработки: `http://localhost:4200`
     - Для продакшена: `https://kartoshk4.github.io/finance-tracker` (ваш GitHub Pages URL)
   - В разделе "Настройки" → "Базовый домен" укажите ваш домен (без протокола и пути)
     - Для разработки: `localhost:4200`
     - Для продакшена: `kartoshk4.github.io` (для GitHub Pages)
   - **ВАЖНО**: В разделе "Настройки" → "Доверенный redirect URI" добавьте **ОБА** URL:
     - Для разработки: `http://localhost:4200` (должен точно совпадать с `vkRedirectUrl` в `environment.ts`)
     - Для продакшена: `https://kartoshk4.github.io/finance-tracker` (должен точно совпадать с `vkRedirectUrl` в `environment.prod.ts`)
     - **Убедитесь, что URL указан БЕЗ завершающего слеша** (`/` в конце)
   - Убедитесь, что включен "Open API"

## Шаг 2: Настройка в приложении

### Для разработки (локально)

1. Откройте файл `src/environments/environment.ts`
2. Убедитесь, что настроены следующие параметры:

```typescript
export const environment = {
  production: false,
  supabaseUrl: 'https://your-project.supabase.co',
  supabaseKey: 'your-supabase-key',
  vkAppId: '12345678', // Ваш ID приложения ВКонтакте
  vkRedirectUrl: 'http://localhost:4200' // URL для локальной разработки
};
```

**Примечание**: Для OneTap секретный ключ (`vkAppSecret`) не требуется на клиенте, так как авторизация происходит через VK ID SDK.

### Для продакшена (GitHub Pages)

Файл `src/environments/environment.prod.ts` уже создан и настроен для вашего домена:

```typescript
export const environment = {
  production: true,
  supabaseUrl: 'https://plvtjfzvxyrycyogiqxu.supabase.co',
  supabaseKey: 'sb_publishable_khftBsbc-UM39EMBiCnyzA_OKuSUA0I',
  vkAppId: '54417167', // ID приложения VK
  vkRedirectUrl: 'https://kartoshk4.github.io/finance-tracker' // GitHub Pages URL (БЕЗ завершающего слеша)
};
```

**⚠️ ВАЖНО:** 
- `vkRedirectUrl` должен точно совпадать с "Доверенный redirect URI" в настройках приложения VK
- URL должен быть БЕЗ завершающего слеша (`/`)
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
2. В шапке приложения должен автоматически появиться виджет VK OneTap
3. Если вы авторизованы в ВКонтакте в текущем браузере, появится возможность авторизоваться в одно касание
4. После успешной авторизации в шапке отобразится ваше имя из ВКонтакте
5. Если OneTap не подходит, можно использовать альтернативный способ входа через кнопку "Войти через ВК"

## Как это работает

1. **Инициализация SDK**: VK ID SDK загружается из CDN при загрузке страницы (`index.html`)
2. **Настройка конфигурации**: При инициализации компонента настраивается конфигурация VK ID с App ID и redirect URL
3. **Рендеринг OneTap**: Виджет OneTap автоматически рендерится в шапке приложения
4. **Авторизация**: Пользователь может авторизоваться в одно касание (если уже авторизован в ВК) или через полный процесс авторизации
5. **Обработка данных**: После успешной авторизации данные пользователя получаются через VK API
6. **Сохранение данных**: Данные пользователя сохраняются в localStorage и опционально в Supabase

## Безопасность

- Токен доступа хранится в localStorage с указанием времени истечения
- Используется параметр `state` для защиты от CSRF атак
- Секретный ключ приложения хранится только на клиенте (для продакшена рекомендуется использовать backend proxy)

## Полезные ссылки

- [Документация VK ID SDK](https://dev.vk.com/ru/api/vkid)
- [Документация ВКонтакте OAuth](https://dev.vk.com/ru/api/access-token/authcode-flow-user)
- [Документация VK API](https://dev.vk.com/ru/api/overview)

## Troubleshooting

### Ошибка "VK App ID не настроен"
- Убедитесь, что вы добавили `vkAppId` и `vkAppSecret` в `environment.ts`

### Ошибка "VK ID SDK не загружен"
- Проверьте подключение скрипта VK ID SDK в `src/index.html`
- Убедитесь, что у вас есть доступ к интернету для загрузки SDK с CDN
- Проверьте консоль браузера на наличие ошибок загрузки скрипта

### Виджет OneTap не отображается
- Убедитесь, что VK App ID настроен правильно в `environment.ts`
- Проверьте консоль браузера на наличие ошибок инициализации
- Убедитесь, что контейнер для виджета существует в DOM

### Ошибка "redirect_uri is missing or invalid"
- **Самая частая ошибка!** Проверьте, что `vkRedirectUrl` в `environment.ts` / `environment.prod.ts` точно совпадает с "Доверенный redirect URI" в настройках приложения VK
- URL должны совпадать **полностью**: протокол (http/https), домен, порт (если есть), путь (если есть)
- Для разработки должен быть: `http://localhost:4200` (не `https://localhost:4200` и не без порта)
- Для продакшена (GitHub Pages): `https://kartoshk4.github.io/finance-tracker` (БЕЗ завершающего слеша)
- **В настройках приложения VK нужно добавить ОБА redirect URI:**
  - `http://localhost:4200` (для разработки)
  - `https://kartoshk4.github.io/finance-tracker` (для продакшена)
- Проверьте настройки приложения ВКонтакте в разделе "Настройки" → "Доверенный redirect URI"
- Убедитесь, что URL указан БЕЗ завершающего слеша (`/`)
- После изменения настроек подождите несколько минут, пока изменения применятся

### Ошибка авторизации
- Проверьте настройки приложения ВКонтакте: адрес сайта и базовый домен должны совпадать
- Убедитесь, что Open API включен в настройках приложения
- Проверьте, что redirect URI правильно настроен (см. выше)
