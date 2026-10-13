import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
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
  isPaid,
} from '../bill-status';

// One bill of the month. The status circle toggles the payment: Fixed bills
// are paid with one click, variable bills first ask for the actual value in
// an inline input. The row only emits; the page does the request.
@Component({
  selector: 'app-bill-row',
  standalone: true,
  imports: [FormsModule, TranslocoPipe, MoneyPipe, LocalDatePipe],
  templateUrl: './bill-row.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bill-row.component.css'
})
export class BillRowComponent implements OnChanges {
  @Input({ required: true }) bill!: Bill;
  @Input({ required: true }) today!: Date;
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
  // The value paid; null for Fixed bills, which keep their value.
  @Output() pay = new EventEmitter<number | null>();
  @Output() undoPayment = new EventEmitter<void>();

  status: BillStatus = 'pending';
  dueText: TranslatedText | null = null;
  amount: number | null = null;
  estimated = false;
  isEnteringValue = false;
  paymentValue: number | null = null;

  @ViewChild('toggle') private toggle?: ElementRef<HTMLButtonElement>;

  // Focuses the value input as soon as it shows up.
  @ViewChild('valueInput') private set valueInput(input: ElementRef<HTMLInputElement> | undefined) {
    input?.nativeElement.focus();
    input?.nativeElement.select();
  }

  ngOnChanges(): void {
    this.status = getStatus(this.bill, this.today);
    this.dueText = getDueText(this.bill, this.today);
    this.amount = getAmount(this.bill);
    this.estimated = isEstimated(this.bill);
    if (this.isPaid) {
      this.isEnteringValue = false;
    }
  }

  get isPaid() {
    return isPaid(this.bill);
  }

  get isVariable() {
    return this.bill.amountType !== 'Fixed';
  }

  get canConfirm() {
    return this.paymentValue !== null && this.paymentValue >= 0;
  }

  togglePayment() {
    if (this.isPaid) {
      this.undoPayment.emit();
    } else if (!this.isVariable) {
      this.pay.emit(null);
    } else if (this.isEnteringValue) {
      this.cancel();
    } else {
      this.paymentValue = this.bill.value ?? this.bill.estimate;
      this.isEnteringValue = true;
    }
  }

  confirm() {
    if (!this.canConfirm) {
      return;
    }
    this.isEnteringValue = false;
    this.pay.emit(this.paymentValue);
  }

  cancel() {
    this.isEnteringValue = false;
    this.toggle?.nativeElement.focus();
  }
}
