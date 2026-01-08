# Пошаговая инструкция по деплою на GitHub Pages

## Шаг 1: Создание репозитория на GitHub (если еще нет)

1. Перейдите на [https://github.com/new](https://github.com/new)
2. Создайте новый репозиторий:
   - **Repository name**: `finance-tracker` (или любое другое имя)
   - **Visibility**: 
     - ⚠️ **Private** (рекомендуется, так как в коде есть секретные ключи)
     - Или **Public** (если не беспокоитесь о безопасности)
   - НЕ добавляйте README, .gitignore или лицензию (они уже есть)
3. Нажмите **Create repository**

## Шаг 2: Подключение локального репозитория к GitHub

Выполните в терминале (замените `YOUR_USERNAME` на ваш GitHub username):

```bash
git remote add origin https://github.com/YOUR_USERNAME/finance-tracker.git
git branch -M master
git push -u origin master
```

## Шаг 3: Настройка GitHub Pages

1. Перейдите в настройки репозитория: **Settings** → **Pages**
2. В разделе **Source** выберите:
   - **Source**: `Deploy from a branch`
   - **Branch**: `gh-pages` → `/ (root)`
   - Нажмите **Save**

## Шаг 4: Настройка кастомного домена (опционально)

### 4.1. Если у вас есть домен:

1. Откройте файл `public/CNAME` и укажите ваш домен:
   ```
   yourdomain.com
   ```

2. Настройте DNS записи у регистратора домена:
   - **Тип**: `A`
   - **Значение**: 
     - `185.199.108.153`
     - `185.199.109.153`
     - `185.199.110.153`
     - `185.199.111.153`

3. После настройки DNS (может занять до 48 часов):
   - GitHub автоматически выдаст SSL сертификат
   - Включите **Enforce HTTPS** в настройках Pages

### 4.2. Если используете стандартный GitHub Pages домен:

Ничего делать не нужно. Сайт будет доступен по адресу:
`https://YOUR_USERNAME.github.io/finance-tracker`

⚠️ **НО**: для стандартного домена нужно изменить base href в `src/index.html` на `/finance-tracker/`

## Шаг 5: Обновление настроек ВКонтакте

1. Перейдите в настройки приложения ВКонтакте: [https://vk.com/apps?act=manage](https://vk.com/apps?act=manage)
2. Выберите ваше приложение
3. В разделе **"Настройки"** → **"Доверенный redirect URI"** добавьте:
   - Если используете кастомный домен: `https://yourdomain.com/auth/callback`
   - Если используете GitHub Pages: `https://YOUR_USERNAME.github.io/finance-tracker/auth/callback`
4. В разделе **"Базовый URI"** укажите:
   - Если используете кастомный домен: `https://yourdomain.com`
   - Если используете GitHub Pages: `https://YOUR_USERNAME.github.io/finance-tracker`

## Шаг 6: Первый деплой

После того как вы подключили репозиторий и запушили код, GitHub Actions автоматически:
1. Соберет приложение
2. Задеплоит его на GitHub Pages

Проверьте статус деплоя:
- Перейдите в раздел **Actions** вашего репозитория
- Дождитесь завершения workflow "Deploy to GitHub Pages"
- После успешного деплоя ваш сайт будет доступен по указанному адресу

## Что делать дальше

После каждого `git push` в ветку `master` приложение будет автоматически обновляться на GitHub Pages.

## Troubleshooting

### GitHub Actions не запускается
- Убедитесь, что файл `.github/workflows/deploy.yml` находится в репозитории
- Проверьте, что вы пушите в ветку `master`

### Сайт не открывается
- Подождите несколько минут после деплоя (может занять до 10 минут)
- Проверьте настройки Pages в Settings → Pages
- Убедитесь, что branch `gh-pages` существует (создается автоматически)

### ВКонтакте авторизация не работает
- Проверьте, что redirect URI точно совпадает с вашим доменом
- Убедитесь, что используется HTTPS
- Проверьте консоль браузера на наличие ошибок

