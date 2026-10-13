import {
  ChangeDetectionStrategy,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
} from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { RecurringBill } from '../../types/recurringBill';
import { BillMonth } from '../../types/billMonth';
import { UserPreferences } from '../../types/userPreferences';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { RecurringBillService } from '../../services/recurring-bill.service';
import { MoneyPipe } from '../../formatting/money.pipe';
import { formatMonth } from '../../formatting/format';
import { TranslatedText, countUnpaidFromCurrentMonth } from '../bill-status';

// Lists the recurring bills. Clicking one asks the page to edit it; the trash
// can opens an inline confirmation and removes it.
@Component({
  selector: 'app-recurring-bills-panel',
  standalone: true,
  imports: [TranslocoPipe, MoneyPipe],
  templateUrl: './recurring-bills-panel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './recurring-bills-panel.component.css'
})
export class RecurringBillsPanelComponent implements OnDestroy {
  @Input() recurringBills: RecurringBill[] = [];
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
  // The loaded months, to count the unpaid bills a removal deletes.
  @Input() months: BillMonth[] = [];
  @Input({ required: true }) today!: Date;
  @Output() edit = new EventEmitter<RecurringBill>();
  @Output() removed = new EventEmitter<RecurringBill>();

  confirmingId: number | null = null;
  confirmText: TranslatedText | null = null;
  isRemoving = false;
  removeError = false;

  private subscription?: Subscription;

  constructor(private recurringBillService: RecurringBillService) {}

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  askRemove(recurringBill: RecurringBill) {
    this.subscription?.unsubscribe();
    this.isRemoving = false;
    this.removeError = false;
    this.confirmingId = recurringBill.id;

    const count = countUnpaidFromCurrentMonth(this.months, recurringBill.id, this.today);
    const params = {
      name: recurringBill.name,
      count,
      month: formatMonth(this.today.getMonth() + 1, this.preferences.locale, 'monthLong'),
    };
    const key =
      count === 0 ? 'confirmRemoveNone' : count === 1 ? 'confirmRemoveOne' : 'confirmRemove';
    this.confirmText = { key: `bills.recurring.${key}`, params };
  }

  cancelRemove() {
    this.subscription?.unsubscribe();
    this.confirmingId = null;
    this.isRemoving = false;
    this.removeError = false;
  }

  confirmRemove(recurringBill: RecurringBill) {
    this.isRemoving = true;
    this.removeError = false;
    this.subscription = this.recurringBillService.delete(recurringBill.id).subscribe({
      next: () => {
        this.isRemoving = false;
        this.confirmingId = null;
        this.removed.emit(recurringBill);
      },
      error: () => {
        this.isRemoving = false;
        this.removeError = true;
      },
    });
  }
}
