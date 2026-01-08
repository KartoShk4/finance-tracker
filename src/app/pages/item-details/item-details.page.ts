import { Component } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ItemService } from '../../features/items/item.service';
import { TransactionService } from '../../features/transactions/transaction.service';
import { Transaction } from '../../features/transactions/transaction.model';

@Component({
  standalone: true,
  imports: [CommonModule],
  templateUrl: './item-details.page.html'
})
export class ItemDetailsPage {

  transactions: Transaction[] = [];

  constructor(
    route: ActivatedRoute,
    transactionService: TransactionService
  ) {
    const id = route.snapshot.paramMap.get('id');
    if (id) {
      this.transactions = transactionService.getByItem(id);
    }
  }
}
