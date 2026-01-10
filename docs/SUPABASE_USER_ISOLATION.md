# Изоляция данных пользователей в Supabase

## Текущая структура базы данных

✅ **Поле `user_id` уже существует** в таблицах `items` и `transactions` (тип `TEXT`).

### Структура таблиц:

1. **Таблица `items`** (категории):
   - `user_id` (TEXT, optional, foreign key к `users.id`)
   - Поле существует и используется для фильтрации

2. **Таблица `transactions`** (транзакции):
   - `user_id` (TEXT, optional, foreign key к `users.id`)
   - Поле существует и используется для фильтрации

3. **Таблица `subcategories`** (теги):
   - Поле `user_id` отсутствует (не требуется)
   - Изоляция данных обеспечивается через связь с `items` через `item_id`
   - Теги принадлежат категории, которая уже имеет `user_id`

4. **Таблица `users`**:
   - `id` (UUID, primary key)
   - `vk_id` (TEXT, уникальный идентификатор VK пользователя)
   - Используется для хранения данных пользователей

## Рекомендации по улучшению (опционально)

Если вы хотите улучшить производительность, можно создать индексы:

### 1. Создать индексы для ускорения поиска (если еще не созданы)

```sql
-- Индекс для быстрого поиска категорий по user_id
CREATE INDEX IF NOT EXISTS idx_items_user_id ON items(user_id);

-- Индекс для быстрого поиска транзакций по user_id
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);

-- Индекс для быстрого поиска транзакций по item_id (если еще не создан)
CREATE INDEX IF NOT EXISTS idx_transactions_item_id ON transactions(item_id);

-- Индекс для быстрого поиска тегов по item_id (если еще не создан)
CREATE INDEX IF NOT EXISTS idx_subcategories_item_id ON subcategories(item_id);
```

### 2. Настроить Row Level Security (RLS) для дополнительной безопасности

**Примечание:** RLS работает только с Supabase Auth. Если используется VK ID для авторизации, RLS не применяется, и фильтрация происходит только в коде приложения (как уже реализовано).

Если вы используете Supabase Auth вместо VK ID, можно настроить RLS:

```sql
-- Включить RLS для таблицы items
ALTER TABLE items ENABLE ROW LEVEL SECURITY;

-- Политика: пользователи могут видеть только свои категории
CREATE POLICY "Users can view own items"
  ON items FOR SELECT
  USING (auth.uid()::text = user_id);

-- Аналогично для таблицы transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON transactions FOR SELECT
  USING (auth.uid()::text = user_id);
```

**Важно:** При использовании VK ID авторизация происходит через VK ID SDK, а не через Supabase Auth. В этом случае RLS не работает, и фильтрация данных обеспечивается в коде приложения, что уже реализовано.

**Важно:** В коде используется поле `user_id`, которое содержит VK ID пользователя. Не используйте поле `vk_id` - его нет в структуре таблиц. Используйте только `user_id`.

## Текущая реализация

✅ Код полностью настроен на работу с существующей структурой базы данных:

1. **`ItemSupabaseRepository`**:
   - ✅ Фильтрует категории по `user_id` при получении (`getAll`)
   - ✅ Автоматически добавляет `user_id` при сохранении (`save`)
   - ✅ Фильтрует по `user_id` при удалении неиспользуемых категорий

2. **`TransactionSupabaseRepository`**:
   - ✅ Фильтрует транзакции по `user_id` при получении (`getAll`)
   - ✅ Автоматически добавляет `user_id` при сохранении (`save`)
   - ✅ Фильтрует по `user_id` при удалении неиспользуемых транзакций

3. **`SubcategorySupabaseRepository`** (теги):
   - ✅ Не требует поля `user_id`, так как изоляция обеспечивается через связь с `items`
   - ✅ Теги фильтруются по `item_id`, который уже принадлежит конкретному пользователю

## Как это работает

1. При авторизации через VK ID получается `user_id` (VK ID пользователя, строка)
2. Этот `user_id` сохраняется в `localStorage` и используется во всех запросах
3. При создании/обновлении категорий и транзакций автоматически добавляется `user_id`
4. При получении данных все запросы фильтруются по `user_id` текущего пользователя
5. Пользователь видит только свои данные

## Миграция существующих данных

Если у вас есть существующие данные без `user_id`, необходимо обновить их:

```sql
-- Обновить существующие категории (заменить 'YOUR_USER_ID' на реальный ID)
UPDATE items
SET user_id = 'YOUR_USER_ID'
WHERE user_id IS NULL;

-- Обновить существующие транзакции
UPDATE transactions
SET user_id = 'YOUR_USER_ID'
WHERE user_id IS NULL;
```

**Важно:** После миграции данных рекомендуется сделать поле `user_id` обязательным для новых записей (если это требуется бизнес-логикой).

