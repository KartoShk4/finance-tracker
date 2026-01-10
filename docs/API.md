# API Документация

## Stores API

### ItemStore

Управление категориями (items).

#### Методы

##### `load(): Promise<void>`
Загружает все категории из базы данных.

##### `create(title: string, category: 'income' | 'expense'): Promise<void>`
Создает новую категорию.

**Параметры:**
- `title` - название категории
- `category` - тип категории ('income' или 'expense')

##### `applyDelta(id: string, delta: number): Promise<void>`
Обновляет сумму категории.

**Параметры:**
- `id` - ID категории
- `delta` - изменение суммы (положительное для дохода, отрицательное для расхода)

#### Signals

##### `items: Signal<Item[]>`
Реактивный список всех категорий.

---

### TransactionStore

Управление транзакциями.

#### Методы

##### `load(): Promise<void>`
Загружает все транзакции из базы данных.

##### `byItem(item_id: string): Signal<Transaction[]>`
Возвращает computed signal с транзакциями для конкретной категории.

**Параметры:**
- `item_id` - ID категории

##### `add(item_id: string, type: 'income' | 'expense', amount: number): Promise<number>`
Добавляет новую транзакцию.

**Параметры:**
- `item_id` - ID категории
- `type` - тип транзакции ('income' или 'expense')
- `amount` - сумма транзакции

**Возвращает:** дельту для обновления общей суммы категории

#### Signals

##### `all: Signal<Transaction[]>`
Реактивный список всех транзакций.

---

## Утилиты

### chart.utils.ts

#### `aggregateByPeriod(transactions: Transaction[], period: PeriodType): { labels: string[], data: number[] }`

Агрегирует транзакции по выбранному периоду.

**Параметры:**
- `transactions` - массив транзакций
- `period` - тип периода ('day', 'week', 'month', 'year')

**Возвращает:** объект с метками (labels) и данными (data)

---

## Модели данных

### Item

```typescript
interface Item {
  id: string;                    // UUID
  title: string;                 // Название
  category: 'income' | 'expense'; // Тип
  total: number;                  // Общая сумма
  lastUpdated: string;            // ISO дата
}
```

### Transaction

```typescript
interface Transaction {
  id: string;                    // UUID
  item_id: string;               // ID категории
  type: 'income' | 'expense';    // Тип
  amount: number;                 // Сумма
  date: string;                   // ISO дата
}
```




