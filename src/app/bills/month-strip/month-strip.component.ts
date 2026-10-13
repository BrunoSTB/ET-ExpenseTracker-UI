import {
  AfterViewChecked,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BillMonth } from '../../types/billMonth';
import { UserPreferences } from '../../types/userPreferences';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { formatMonth } from '../../formatting/format';
import {
  BillStatus,
  TranslatedText,
  countOverdueInYear,
  getMonthCounts,
  getMonthSummary,
  getStatus,
  sortByDueDate,
} from '../bill-status';

interface MonthCard {
  month: number;
  name: string;
  dots: { id: number; status: BillStatus }[];
  summary: TranslatedText;
}

@Component({
  selector: 'app-month-strip',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './month-strip.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './month-strip.component.css'
})
export class MonthStripComponent implements OnChanges, AfterViewChecked {
  @Input({ required: true }) year!: number;
  // One entry per month, January first.
  @Input() months: BillMonth[] = [];
  // 1-based.
  @Input() selectedMonth = 1;
  @Input({ required: true }) today!: Date;
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
  @Output() monthSelected = new EventEmitter<number>();

  cards: MonthCard[] = [];
  overdueThisYear = 0;
  private scrollToSelected = true;

  constructor(private element: ElementRef<HTMLElement>) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['selectedMonth']) {
      this.scrollToSelected = true;
    }

    this.cards = this.months.map((billMonth) => ({
      month: billMonth.month,
      name: formatMonth(billMonth.month, this.preferences.locale),
      dots: sortByDueDate(billMonth.bills).map((bill) => ({
        id: bill.id,
        status: getStatus(bill, this.today),
      })),
      summary: getMonthSummary(getMonthCounts(billMonth.bills, this.today)),
    }));
    this.overdueThisYear = countOverdueInYear(this.months, this.today);
  }

  // Keeps the selected card visible when the strip scrolls horizontally.
  ngAfterViewChecked(): void {
    if (!this.scrollToSelected) {
      return;
    }
    this.scrollToSelected = false;
    this.element.nativeElement
      .querySelector('.month-card.selected')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }

  select(month: number) {
    this.monthSelected.emit(month);
  }
}
