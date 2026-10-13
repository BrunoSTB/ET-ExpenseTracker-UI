import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { BillService } from '../../services/bill.service';
import { RecurringBillService } from '../../services/recurring-bill.service';
import { DEFAULT_PREFERENCES, PreferencesService } from '../../services/preferences.service';
import { BillMonth } from '../../types/billMonth';
import { RecurringBill } from '../../types/recurringBill';
import { UserPreferences } from '../../types/userPreferences';
import { MonthStripComponent } from '../month-strip/month-strip.component';
import { MonthDetailComponent } from '../month-detail/month-detail.component';
import { RecurringBillsPanelComponent } from '../recurring-bills-panel/recurring-bills-panel.component';
import { StatusLegendComponent } from '../status-legend/status-legend.component';

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

  private subscriptions = new Subscription();
  private yearSubscription?: Subscription;

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
