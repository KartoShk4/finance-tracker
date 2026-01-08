import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { SubcategoryStore } from '../../features/subcategories/subcategory.store';
import { DateTimePickerComponent } from '../../shared/components/date-time-picker/date-time-picker.component';
import { LocalDatePipe } from '../../shared/pipes/date-format.pipe';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { ModalComponent } from '../../shared/components/modal/modal.component';
import { aggregateByPeriod, PeriodType } from '../../shared/utils/chart.utils';

/**
 * Компонент страницы деталей item
 * Отображает транзакции для конкретной категории и график
 */
@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, DateTimePickerComponent, LocalDatePipe, ChartComponent, ModalComponent],
  templateUrl: './item-details.page.html',
  styleUrls: ['./item-details.page.scss']
})
export class ItemDetailsPage {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private txStore = inject(TransactionStore);
  private itemStore = inject(ItemStore);
  private subcategoryStore = inject(SubcategoryStore);

  /** ID текущего item из параметров маршрута */
  itemId = this.route.snapshot.paramMap.get('id')!;

  /** Сумма для новой транзакции */
  amount = 0;

  /** Дата и время транзакции */
  transactionDate: string = new Date().toISOString();

  /** Примечание к транзакции */
  notes = '';

  /** Выбранная подкатегория для транзакции */
  selectedSubcategoryId: string | null = null;

  /** Название новой подкатегории (для быстрого создания) */
  newSubcategoryName = '';

  /** ID транзакции, которая редактируется (null если не редактируется) */
  editingTransactionId: string | null = null;

  /** Поля для редактирования транзакции */
  editAmount = 0;
  editDate: string = '';
  editNotes = '';
  editSubcategoryId: string | null = null;

  /** Выбранный период для графика */
  selectedPeriod = signal<PeriodType>('day');

  /** Подкатегории для текущей категории */
  subcategories = this.subcategoryStore.byItemId(this.itemId);

  /** Состояние модальных окон */
  showDeleteCategoryModal = false;
  showDeleteSubcategoryModal = false;
  subcategoryToDelete: string | null = null;

  /**
   * Получение названия подкатегории по ID
   */
  getSubcategoryName(subcategoryId: string): string {
    const sub = this.subcategories().find(s => s.id === subcategoryId);
    return sub?.title || '';
  }

  /** Текущая категория */
  currentItem = computed(() => {
    return this.itemStore.items().find(item => item.id === this.itemId);
  });

  /** Тип транзакции берется из категории */
  get transactionType(): 'income' | 'expense' {
    return this.currentItem()?.category || 'income';
  }

  /** Транзакции для текущего item */
  transactions = this.txStore.byItem(this.itemId);

  /** Данные для графика, агрегированные по выбранному периоду */
  chartData = computed(() => {
    const transactions = this.transactions();
    if (transactions.length === 0) {
      return { labels: [], data: [] };
    }
    return aggregateByPeriod(transactions, this.selectedPeriod());
  });

  /**
   * Добавление новой транзакции
   * Тип транзакции автоматически берется из категории
   */
  async addTransaction(): Promise<void> {
    if (this.amount <= 0) return;
    
    const item = this.currentItem();
    if (!item) return;

    // Тип транзакции соответствует типу категории
    const type = item.category;

    let subcategoryId: string | undefined = undefined;

    // Если выбрано создание новой подкатегории
    if (this.selectedSubcategoryId === '__create_new__') {
      if (!this.newSubcategoryName.trim()) {
        alert('Введите название подкатегории');
        return;
      }
      // Создаем подкатегорию
      const subcategory = await this.subcategoryStore.create(this.itemId, this.newSubcategoryName.trim());
      subcategoryId = subcategory.id;
    } else if (this.selectedSubcategoryId) {
      subcategoryId = this.selectedSubcategoryId;
    }

    // Добавляем транзакцию с выбранной датой, примечанием и подкатегорией, получаем дельту (изменение суммы)
    const delta = await this.txStore.add(
      this.itemId, 
      type, 
      this.amount, 
      this.transactionDate, 
      this.notes,
      subcategoryId
    );
    
    // Обновляем общую сумму item
    await this.itemStore.applyDelta(this.itemId, delta);
    
    // Сбрасываем форму
    this.amount = 0;
    this.transactionDate = new Date().toISOString();
    this.notes = '';
    this.selectedSubcategoryId = null;
    this.newSubcategoryName = '';
  }

  /**
   * Обработка потери фокуса при создании подкатегории
   */
  onSubcategoryNameBlur(): void {
    // Если название введено, можно автоматически создать подкатегорию при потере фокуса
    // Или оставить как есть - создание произойдет при отправке формы
  }

  /**
   * Удаление транзакции
   * @param id - ID транзакции
   */
  async deleteTransaction(id: string): Promise<void> {
    // Удаляем транзакцию и получаем дельту для отката изменений
    const delta = await this.txStore.delete(id);
    
    // Обновляем общую сумму item (откатываем изменения)
    await this.itemStore.applyDelta(this.itemId, delta);
  }

  /**
   * Начало редактирования транзакции
   * @param transaction - транзакция для редактирования
   */
  startEdit(transaction: { id: string; amount: number; date: string; notes?: string; subcategory_id?: string }): void {
    this.editingTransactionId = transaction.id;
    this.editAmount = transaction.amount;
    this.editDate = transaction.date;
    this.editNotes = transaction.notes || '';
    this.editSubcategoryId = transaction.subcategory_id || null;
  }

  /**
   * Отмена редактирования
   */
  cancelEdit(): void {
    this.editingTransactionId = null;
    this.editAmount = 0;
    this.editDate = '';
    this.editNotes = '';
    this.editSubcategoryId = null;
  }

  /**
   * Сохранение изменений транзакции
   * @param id - ID транзакции
   */
  async saveEdit(id: string): Promise<void> {
    if (this.editAmount <= 0) return;
    
    // Убеждаемся, что дата валидна и в формате ISO
    let validDate = this.editDate;
    if (!validDate || validDate.trim() === '') {
      // Если дата не указана, используем текущую дату
      validDate = new Date().toISOString();
    } else {
      // Проверяем, что дата валидна
      const dateObj = new Date(validDate);
      if (isNaN(dateObj.getTime())) {
        validDate = new Date().toISOString();
      } else {
        validDate = dateObj.toISOString();
      }
    }

    // Обновляем транзакцию и получаем дельту для обновления общей суммы
    const delta = await this.txStore.update(id, {
      amount: this.editAmount,
      date: validDate,
      notes: this.editNotes,
      subcategory_id: this.editSubcategoryId || undefined
    });

    // Обновляем общую сумму item
    await this.itemStore.applyDelta(this.itemId, delta);

    // Сбрасываем состояние редактирования
    this.cancelEdit();
  }


  /**
   * Открытие модального окна удаления категории
   */
  openDeleteCategoryModal(): void {
    this.showDeleteCategoryModal = true;
  }

  /**
   * Удаление категории
   */
  async confirmDeleteCategory(): Promise<void> {
    await this.itemStore.delete(this.itemId);
    this.showDeleteCategoryModal = false;
    this.router.navigate(['/']);
  }

  /**
   * Открытие модального окна удаления подкатегории
   * @param id - ID подкатегории
   */
  openDeleteSubcategoryModal(id: string): void {
    this.subcategoryToDelete = id;
    this.showDeleteSubcategoryModal = true;
  }

  /**
   * Удаление подкатегории
   */
  async confirmDeleteSubcategory(): Promise<void> {
    if (this.subcategoryToDelete) {
      await this.subcategoryStore.delete(this.subcategoryToDelete);
      this.subcategoryToDelete = null;
    }
    this.showDeleteSubcategoryModal = false;
  }
}
