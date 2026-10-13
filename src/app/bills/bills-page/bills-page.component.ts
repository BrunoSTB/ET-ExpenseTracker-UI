import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Observable, Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { BillService } from '../../services/bill.service';
import { RecurringBillService } from '../../services/recurring-bill.service';
import { DEFAULT_PREFERENCES, PreferencesService } from '../../services/preferences.service';
import { Bill } from '../../types/bill';
import { BillMonth } from '../../types/billMonth';
import { RecurringBill } from '../../types/recurringBill';
import { UserPreferences } from '../../types/userPreferences';
import { MonthStripComponent } from '../month-strip/month-strip.component';
import { BillPaymentEvent, MonthDetailComponent } from '../month-detail/month-detail.component';
import { RecurringBillsPanelComponent } from '../recurring-bills-panel/recurring-bills-panel.component';
import { StatusLegendComponent } from '../status-legend/status-legend.component';
import { toIsoDate } from '../../formatting/format';

// Container of the bills screen: owns the year, the selected month and the
// loading state, and passes the data down to the display components.
@Component({
  selector: 'app-bills-page',
  standalone: true,
  imports: [
    TranslocoPipe,
    MonthStripComponent,
    MonthDetailComponent,
    RecurringBillsPanelComponent,
    StatusLegendComponent,
  ],
  templateUrl: './bills-page.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './bills-page.component.css'
})
export class BillsPageComponent implements OnInit, OnDestroy {
  today = new Date();
  year = this.today.getFullYear();
  // 1-based; the current month comes selected.
  selectedMonth = this.today.getMonth() + 1;
  // Always 12 entries, January first.
  months: BillMonth[] = [];
  recurringBills: RecurringBill[] = [];
  preferences: UserPreferences = DEFAULT_PREFERENCES;
  isLoading = true;
  yearError = false;
  recurringError = false;
  // Translation key and bill name of the last payment that failed.
  paymentError: { key: string; name: string } | null = null;

  private subscriptions = new Subscription();
  private yearSubscription?: Subscription;
  // Bills with a payment request in flight; clicks on them are ignored.
  private pendingBillIds = new Set<number>();

  constructor(
    private billService: BillService,
    private recurringBillService: RecurringBillService,
    private preferencesService: PreferencesService
  ) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.preferencesService
        .getPreferences()
        .subscribe((preferences) => (this.preferences = preferences))
    );
    // Keeps the defaults if the preferences can't be loaded.
    this.subscriptions.add(
      this.preferencesService.load().subscribe({ error: () => {} })
    );
    this.subscriptions.add(
      this.recurringBillService.list().subscribe({
        next: (recurringBills) => (this.recurringBills = recurringBills),
        error: () => (this.recurringError = true),
      })
    );
    this.loadYear();
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.yearSubscription?.unsubscribe();
  }

  get hasError() {
    return this.yearError || this.recurringError;
  }

  get selectedBills() {
    return this.months[this.selectedMonth - 1]?.bills ?? [];
  }

  selectMonth(month: number) {
    this.selectedMonth = month;
  }

  previousMonth() {
    if (this.selectedMonth === 1) {
      this.changeYear(this.year - 1, 12);
    } else {
      this.selectedMonth--;
    }
  }

  nextMonth() {
    if (this.selectedMonth === 12) {
      this.changeYear(this.year + 1, 1);
    } else {
      this.selectedMonth++;
    }
  }

  // Works in any month, future ones included (paying in advance).
  payBill({ bill, value }: BillPaymentEvent) {
    const paid: Bill = {
      ...bill,
      paidAt: toIsoDate(this.today),
      value: value ?? bill.value,
    };
    this.updatePayment(bill, paid, this.billService.pay(bill.id, value), 'bills.payment.payError');
  }

  undoPayment(bill: Bill) {
    // Variable bills go back to their estimate; the server answer confirms it.
    const unpaid: Bill = {
      ...bill,
      paidAt: null,
      value: bill.amountType === 'Fixed' ? bill.value : null,
    };
    this.updatePayment(bill, unpaid, this.billService.undoPayment(bill.id), 'bills.payment.undoError');
  }

  // Shows the change right away, then keeps the bill the server returns, or
  // rolls back to the original bill and shows an error if the request fails.
  private updatePayment(
    original: Bill,
    optimistic: Bill,
    request: Observable<Bill>,
    errorKey: string
  ) {
    if (this.pendingBillIds.has(original.id)) {
      return;
    }
    this.pendingBillIds.add(original.id);
    this.paymentError = null;
    this.replaceBill(optimistic);

    this.subscriptions.add(
      request.subscribe({
        next: (bill) => {
          this.pendingBillIds.delete(original.id);
          this.replaceBill(bill);
        },
        error: () => {
          this.pendingBillIds.delete(original.id);
          this.replaceBill(original);
          this.paymentError = { key: errorKey, name: original.name };
        },
      })
    );
  }

  // Replaces the bill with the same id, creating new arrays so the strip and
  // the month detail recalculate. No-op if the bill is not in the loaded year.
  private replaceBill(bill: Bill) {
    this.months = this.months.map((billMonth) =>
      billMonth.bills.some((current) => current.id === bill.id)
        ? {
            ...billMonth,
            bills: billMonth.bills.map((current) => (current.id === bill.id ? bill : current)),
          }
        : billMonth
    );
  }

  private changeYear(year: number, month: number) {
    this.year = year;
    this.selectedMonth = month;
    this.loadYear();
  }

  private loadYear() {
    // Only the latest year matters when navigating quickly across years.
    this.yearSubscription?.unsubscribe();
    this.isLoading = true;
    this.yearError = false;

    const year = this.year;
    this.yearSubscription = this.billService.getYear(year).subscribe({
      next: (billMonths) => {
        this.months = fillMonths(billMonths);
        this.isLoading = false;
      },
      error: () => {
        this.months = fillMonths([]);
        this.yearError = true;
        this.isLoading = false;
      },
    });
  }
}

// One entry per month, with empty lists for the months the API left out.
function fillMonths(billMonths: BillMonth[]): BillMonth[] {
  return Array.from({ length: 12 }, (_, index) => ({
    month: index + 1,
    bills: billMonths.find((billMonth) => billMonth.month === index + 1)?.bills ?? [],
  }));
}
