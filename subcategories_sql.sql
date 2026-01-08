-- ============================================
-- SQL ЗАПРОСЫ ДЛЯ СОЗДАНИЯ ПОДКАТЕГОРИЙ
-- ============================================

-- 1. Создание таблицы подкатегорий
-- Подкатегории связаны с категориями (items) через внешний ключ
CREATE TABLE IF NOT EXISTS subcategories (
  -- Уникальный идентификатор подкатегории
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- ID родительской категории (связь с таблицей items)
  item_id UUID NOT NULL REFERENCES items(id) ON DELETE CASCADE,
  
  -- Название подкатегории
  title TEXT NOT NULL,
  
  -- Порядок сортировки внутри категории (для drag-and-drop)
  sort_order INTEGER,
  
  -- Дата и время создания
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Дата и время последнего обновления
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Уникальность: название подкатегории должно быть уникальным в рамках одной категории
  CONSTRAINT unique_subcategory_per_item UNIQUE (item_id, title)
);

-- 2. Создание индексов для оптимизации запросов
-- Индекс для быстрого поиска подкатегорий по категории
CREATE INDEX IF NOT EXISTS idx_subcategories_item_id ON subcategories(item_id);

-- Индекс для сортировки подкатегорий внутри категории
CREATE INDEX IF NOT EXISTS idx_subcategories_sort_order ON subcategories(item_id, sort_order ASC NULLS LAST);

-- 3. Добавление колонки subcategory_id в таблицу transactions
-- Это позволит связывать транзакции с подкатегориями
ALTER TABLE transactions 
ADD COLUMN IF NOT EXISTS subcategory_id UUID REFERENCES subcategories(id) ON DELETE SET NULL;

-- Индекс для быстрого поиска транзакций по подкатегории
CREATE INDEX IF NOT EXISTS idx_transactions_subcategory_id ON transactions(subcategory_id);

-- 4. Функция для автоматического обновления updated_at
CREATE OR REPLACE FUNCTION update_subcategories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Триггер для автоматического обновления updated_at
CREATE TRIGGER trigger_update_subcategories_updated_at
  BEFORE UPDATE ON subcategories
  FOR EACH ROW
  EXECUTE FUNCTION update_subcategories_updated_at();

-- 6. Комментарии к таблице и колонкам (для документации)
COMMENT ON TABLE subcategories IS 'Подкатегории для более детальной группировки транзакций внутри категорий';
COMMENT ON COLUMN subcategories.id IS 'Уникальный идентификатор подкатегории (UUID)';
COMMENT ON COLUMN subcategories.item_id IS 'ID родительской категории (связь с таблицей items)';
COMMENT ON COLUMN subcategories.title IS 'Название подкатегории';
COMMENT ON COLUMN subcategories.sort_order IS 'Порядок сортировки подкатегорий внутри категории';
COMMENT ON COLUMN subcategories.created_at IS 'Дата и время создания подкатегории';
COMMENT ON COLUMN subcategories.updated_at IS 'Дата и время последнего обновления подкатегории';
COMMENT ON COLUMN transactions.subcategory_id IS 'ID подкатегории, к которой относится транзакция (необязательное поле)';

-- ============================================
-- ПРИМЕРЫ ЗАПРОСОВ ДЛЯ РАБОТЫ С ПОДКАТЕГОРИЯМИ
-- ============================================

-- Получить все подкатегории для конкретной категории, отсортированные по sort_order
-- SELECT * FROM subcategories WHERE item_id = 'your-item-id' ORDER BY sort_order ASC NULLS LAST;

-- Получить все транзакции с подкатегориями
-- SELECT t.*, s.title as subcategory_title 
-- FROM transactions t 
-- LEFT JOIN subcategories s ON t.subcategory_id = s.id 
-- WHERE t.item_id = 'your-item-id';

-- Получить статистику по подкатегориям
-- SELECT 
--   s.id,
--   s.title,
--   COUNT(t.id) as transaction_count,
--   SUM(t.amount) as total_amount
-- FROM subcategories s
-- LEFT JOIN transactions t ON t.subcategory_id = s.id
-- WHERE s.item_id = 'your-item-id'
-- GROUP BY s.id, s.title
-- ORDER BY s.sort_order ASC NULLS LAST;

