import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

import { ItemStore } from '../../features/items/item.store';
import { TransactionStore } from '../../features/transactions/transaction.store';
import { ChartComponent } from '../../shared/components/chart/chart.component';
import { aggregateByDate } from '../../shared/utils/chart.utils';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, ChartComponent],
  templateUrl: './item-details.page.html'
})
export class ItemDetailsPage {
  private route = inject(ActivatedRoute);
  private txStore = inject(TransactionStore);
  private itemStore = inject(ItemStore);

  itemId = this.route.snapshot.paramMap.get('id')!;

  amount = 0;
  type: 'income' | 'expense' = 'income';

  transactions = this.txStore.byItem(this.itemId);

  chartData = computed(() => {
    const agg = aggregateByDate(this.transactions());
    return { labels: agg.labels, data: agg.data };
  });

  addTransaction(): void {
    if (this.amount <= 0) return;

    const delta = this.txStore.add(
      this.itemId,
      this.type,
      this.amount
    );

    this.itemStore.applyDelta(this.itemId, delta);
    this.amount = 0;
  }
}
