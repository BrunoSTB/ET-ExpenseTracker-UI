import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Bill } from '../../types/bill';
import { UserPreferences } from '../../types/userPreferences';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { formatDate } from '../../formatting/format';
import { MoneyPipe } from '../../formatting/money.pipe';
import { BillRowComponent } from '../bill-row/bill-row.component';
import {
  MonthCounts,
  MonthTotals,
  getMonthCounts,
  getMonthTotals,
  isPaid,
  sortByDueDate,
} from '../bill-status';

export interface BillPaymentEvent {
  bill: Bill;
  // Null for Fixed bills, which keep their value.
  value: number | null;
}

@Component({
  selector: 'app-month-detail',
  standalone: true,
  imports: [TranslocoPipe, MoneyPipe, BillRowComponent],
  templateUrl: './month-detail.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './month-detail.component.css'
})
export class MonthDetailComponent implements OnChanges {
  @Input({ required: true }) year!: number;
  // 1-based.
  @Input({ required: true }) month!: number;
  @Input() bills: Bill[] = [];
  @Input({ required: true }) today!: Date;
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
  @Output() previous = new EventEmitter<void>();
  @Output() next = new EventEmitter<void>();
  @Output() addBill = new EventEmitter<void>();
  @Output() billRemoved = new EventEmitter<Bill>();
  @Output() pay = new EventEmitter<BillPaymentEvent>();
  @Output() undoPayment = new EventEmitter<Bill>();

  title = '';
  toPay: Bill[] = [];
  paid: Bill[] = [];
  counts!: MonthCounts;
  totals!: MonthTotals;
  // Widths of the progress bar segments, in percent of the bill count.
  progress = { paid: 0, overdue: 0 };

  ngOnChanges(): void {
    this.title = formatDate(
      new Date(this.year, this.month - 1, 1),
      this.preferences.locale,
      'monthYear'
    );

    const sorted = sortByDueDate(this.bills);
    this.toPay = sorted.filter((bill) => !isPaid(bill));
    this.paid = sorted.filter(isPaid);

    this.counts = getMonthCounts(this.bills, this.today);
    this.totals = getMonthTotals(this.bills, this.today);

    const total = this.counts.total || 1;
    this.progress = {
      paid: (this.counts.paid / total) * 100,
      overdue: (this.counts.overdue / total) * 100,
    };
  }
}
