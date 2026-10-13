import { ChangeDetectionStrategy, Component, Input, OnChanges } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { Bill } from '../../types/bill';
import { UserPreferences } from '../../types/userPreferences';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { MoneyPipe } from '../../formatting/money.pipe';
import { LocalDatePipe } from '../../formatting/local-date.pipe';
import {
  BillStatus,
  TranslatedText,
  getAmount,
  getDueText,
  getStatus,
  isEstimated,
} from '../bill-status';

// Display only for now; the pay/edit actions come in Phase 3.
@Component({
  selector: 'app-bill-row',
  standalone: true,
  imports: [TranslocoPipe, MoneyPipe, LocalDatePipe],
  templateUrl: './bill-row.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bill-row.component.css'
})
export class BillRowComponent implements OnChanges {
  @Input({ required: true }) bill!: Bill;
  @Input({ required: true }) today!: Date;
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;

  status: BillStatus = 'pending';
  dueText: TranslatedText | null = null;
  amount: number | null = null;
  estimated = false;

  ngOnChanges(): void {
    this.status = getStatus(this.bill, this.today);
    this.dueText = getDueText(this.bill, this.today);
    this.amount = getAmount(this.bill);
    this.estimated = isEstimated(this.bill);
  }

  get isVariable() {
    return this.bill.amountType !== 'Fixed';
  }
}
