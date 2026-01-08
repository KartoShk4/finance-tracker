import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { ItemService } from '../../features/items/item.service';
import { TransactionService } from '../../features/transactions/transaction.service';
import { Transaction } from '../../features/transactions/transaction.model';

import { ChartComponent } from '../../shared/components/chart/chart.component';
import { aggregateByDate } from '../../shared/utils/chart.utils';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComponent],
  templateUrl: './item-details.page.html'
})
export class ItemDetailsPage {

  itemId!: string;

  transactions: Transaction[] = [];

  amount = 0;
  type: 'income' | 'expense' = 'income';

  labels: string[] = [];
  data: number[] = [];

  constructor(
    route: ActivatedRoute,
    private transactionService: TransactionService,
    private itemService: ItemService
  ) {
    const id = route.snapshot.paramMap.get('id');
    if (!id) return;

    this.itemId = id;
    this.reload();
  }

  /**
   * Добавление новой операции
   */
  addTransaction(): void {
    if (this.amount <= 0) return;

    // 1. Создаём транзакцию и получаем дельту
    const delta = this.transactionService.add(
      this.itemId,
      this.type,
      this.amount
    );

    // 2. Обновляем Item.total
    this.itemService.applyDelta(this.itemId, delta);

    // 3. Обновляем UI
    this.amount = 0;
    this.reload();
  }

  /**
   * Перезагрузка данных и графика
   */
  private reload(): void {
    this.transactions = this.transactionService.getByItem(this.itemId);

    const aggregated = aggregateByDate(this.transactions);
    this.labels = aggregated.labels;
    this.data = aggregated.data;
  }
}
