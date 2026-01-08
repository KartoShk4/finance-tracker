import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { TransactionService } from '../../features/transactions/transaction.service';
import { Transaction } from '../../features/transactions/transaction.model';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { aggregateByDate } from '../../shared/utils/chart.utils';

@Component({
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './item-details.page.html'
})
export class ItemDetailsPage {

  transactions: Transaction[] = [];

  labels: string[] = [];
  data: number[] = [];

  constructor(
    route: ActivatedRoute,
    transactionService: TransactionService
  ) {
    const id = route.snapshot.paramMap.get('id');
    if (!id) return;

    // Загружаем все операции
    this.transactions = transactionService.getByItem(id);

    // Готовим данные для графика
    const aggregated = aggregateByDate(this.transactions);
    this.labels = aggregated.labels;
    this.data = aggregated.data;
  }
}
