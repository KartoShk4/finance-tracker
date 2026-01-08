# Деплой на GitHub Pages с кастомным доменом

## Шаг 1: Подготовка проекта

### 1.1. Настройка base href

Для GitHub Pages нужно настроить правильный base href. Если вы используете кастомный домен (например, `yourdomain.com`), base href должен быть `/`.

В файле `src/index.html` уже установлен `<base href="/">`, что подходит для кастомного домена.

Если вы используете GitHub Pages без кастомного домена (например, `username.github.io/repo-name`), нужно изменить base href на `/repo-name/`.

### 1.2. Создание GitHub Actions workflow

Файл `.github/workflows/deploy.yml` уже создан и настроен для автоматического деплоя.

## Шаг 2: Настройка GitHub Pages

1. Перейдите в настройки вашего репозитория на GitHub
2. Перейдите в раздел **Pages** (в левом меню)
3. В разделе **Source** выберите:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` (эта ветка будет создана автоматически при первом деплое)
   - **Folder**: `/ (root)`
4. Нажмите **Save**

## Шаг 3: Настройка кастомного домена

### 3.1. Создание файла CNAME

1. Создайте файл `public/CNAME` (или `src/CNAME`, в зависимости от структуры проекта)
2. Добавьте в него ваш домен (без `http://` или `https://`):

```
yourdomain.com
```

Или если у вас поддомен:

```
app.yourdomain.com
```

### 3.2. Настройка DNS

Настройте DNS записи у вашего регистратора домена:

**Для корневого домена (yourdomain.com):**
- Тип: `A`
- Имя: `@` или оставьте пустым
- Значение: `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`

**Для поддомена (www.yourdomain.com или app.yourdomain.com):**
- Тип: `CNAME`
- Имя: `www` или `app`
- Значение: `username.github.io` (замените на ваш GitHub username)

### 3.3. Включение HTTPS

После настройки DNS GitHub автоматически выдаст SSL сертификат (может занять до 24 часов). Убедитесь, что в настройках Pages включена опция **Enforce HTTPS**.

## Шаг 4: Обновление настроек ВКонтакте

1. Перейдите в настройки вашего приложения ВКонтакте: [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage)
2. Выберите ваше приложение
3. В разделе **"Настройки"** → **"Доверенный redirect URI"** добавьте:
   - `https://yourdomain.com/auth/callback` (для кастомного домена)
   - Или `https://username.github.io/auth/callback` (если используете стандартный GitHub Pages домен)
4. В разделе **"Базовый URI"** укажите:
   - `https://yourdomain.com` (для кастомного домена)
   - Или `https://username.github.io` (для стандартного домена)

## Шаг 5: Обновление environment.ts для продакшена

Файл `src/environments/environment.prod.ts` уже создан и настроен. Он будет автоматически использоваться при production build.

**⚠️ ВАЖНО:** Если ваш репозиторий публичный, не коммитьте реальные секретные ключи! Используйте GitHub Secrets для хранения чувствительных данных и обновляйте их через GitHub Actions.

### Альтернатива: Использование GitHub Secrets

Если вы не хотите хранить секреты в коде, можно использовать GitHub Secrets:

1. Перейдите в настройки репозитория → **Secrets and variables** → **Actions**
2. Добавьте следующие секреты:
   - `SUPABASE_URL`
   - `SUPABASE_KEY`
   - `VK_APP_ID`
   - `VK_APP_SECRET`

3. Обновите `.github/workflows/deploy.yml` для использования секретов (см. комментарии в файле)

## Шаг 6: Первый деплой

1. Закоммитьте все изменения:
   ```bash
   git add .
   git commit -m "Setup GitHub Pages deployment"
   git push origin main
   ```

2. GitHub Actions автоматически соберет и задеплоит приложение

3. Проверьте статус деплоя в разделе **Actions** вашего репозитория

4. После успешного деплоя ваш сайт будет доступен по адресу:
   - `https://yourdomain.com` (если настроен кастомный домен)
   - `https://username.github.io/repo-name` (если используется стандартный GitHub Pages)

## Troubleshooting

### Проблема: Страница не загружается / 404 ошибка

**Решение:**
- Убедитесь, что base href правильный в `src/index.html`
- Проверьте, что файл `CNAME` находится в правильной папке
- Убедитесь, что DNS записи настроены правильно (может занять до 48 часов)

### Проблема: ВКонтакте авторизация не работает

**Решение:**
- Проверьте, что redirect URI в настройках ВКонтакте точно совпадает с вашим доменом
- Убедитесь, что используется HTTPS (ВКонтакте требует HTTPS для OAuth)
- Проверьте консоль браузера на наличие ошибок

### Проблема: GitHub Actions не деплоит

**Решение:**
- Проверьте, что workflow файл находится в `.github/workflows/`
- Убедитесь, что ветка называется `main` (или измените в workflow на вашу основную ветку)
- Проверьте логи в разделе Actions на GitHub

## Полезные ссылки

- [Документация GitHub Pages](https://docs.github.com/en/pages)
- [Настройка кастомного домена на GitHub Pages](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site)
- [GitHub Actions для деплоя](https://github.com/peaceiris/actions-gh-pages)

