import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  Output,
  SimpleChanges,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { BillService } from '../../services/bill.service';
import { RecurringBillService } from '../../services/recurring-bill.service';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { AmountType } from '../../types/amountType';
import { RecurringBill } from '../../types/recurringBill';
import { UserPreferences } from '../../types/userPreferences';
import { formatDate } from '../../formatting/format';
import { dueDateInMonth } from '../bill-status';

export const AMOUNT_TYPES: AmountType[] = ['Fixed', 'VariableEstimated', 'VariableOnArrival'];

export interface BillFormErrors {
  name?: string;
  dueDay?: string;
  value?: string;
}

// Adds a bill (recurring from the open month on, or one-off in the open month) or, given a
// `recurringBill`, edits it. Emits `saved` after the API call succeeds.
@Component({
  selector: 'app-add-bill-form',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './add-bill-form.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './add-bill-form.component.css'
})
export class AddBillFormComponent implements OnChanges, AfterViewInit, OnDestroy {
  // Year and 1-based month of one-off bills and of the first month of new
  // recurring bills.
  @Input({ required: true }) year!: number;
  @Input({ required: true }) month!: number;
  // Edit mode when set.
  @Input() recurringBill: RecurringBill | null = null;
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
  @Output() saved = new EventEmitter<void>();
  @Output() cancelled = new EventEmitter<void>();

  @ViewChild('nameInput') nameInput?: ElementRef<HTMLInputElement>;

  amountTypes = AMOUNT_TYPES;
  model = {
    name: '',
    dueDay: null as number | null,
    amountType: 'Fixed' as AmountType,
    value: null as number | null,
    repeats: true,
  };
  errors: BillFormErrors = {};
  submitted = false;
  isSaving = false;
  saveError = false;

  private subscription?: Subscription;

  constructor(
    private billService: BillService,
    private recurringBillService: RecurringBillService
  ) {}

  ngOnChanges(changes: SimpleChanges): void {
    // Only a new bill to edit resets the form; moving through the months
    // keeps what was typed.
    if (!changes['recurringBill']) {
      return;
    }
    const recurringBill = this.recurringBill;
    this.model = recurringBill
      ? {
          name: recurringBill.name,
          dueDay: recurringBill.dueDay,
          amountType: recurringBill.amountType,
          value: recurringBill.fixedValue,
          repeats: true,
        }
      : { name: '', dueDay: null, amountType: 'Fixed', value: null, repeats: true };
    this.errors = {};
    this.submitted = false;
    this.saveError = false;
  }

  ngAfterViewInit(): void {
    this.nameInput?.nativeElement.focus();
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  get isEditing() {
    return this.recurringBill !== null;
  }

  get isFixed() {
    return this.model.amountType === 'Fixed';
  }

  get monthName() {
    return formatDate(new Date(this.year, this.month - 1, 1), this.preferences.locale, 'monthYear');
  }

  validate(): BillFormErrors {
    const errors: BillFormErrors = {};
    const { name, dueDay, value } = this.model;

    if (!name.trim()) {
      errors.name = 'bills.form.errors.nameRequired';
    }
    if (dueDay === null || !Number.isInteger(dueDay) || dueDay < 1 || dueDay > 31) {
      errors.dueDay = 'bills.form.errors.dueDayRange';
    }
    // The value only applies to fixed bills.
    if (this.isFixed && (value === null || !(value > 0))) {
      errors.value = 'bills.form.errors.valueRequired';
    }
    return errors;
  }

  onFieldChange() {
    if (this.submitted) {
      this.errors = this.validate();
    }
  }

  onSubmit() {
    this.submitted = true;
    this.errors = this.validate();
    if (Object.keys(this.errors).length > 0 || this.isSaving) {
      return;
    }

    this.isSaving = true;
    this.saveError = false;
    this.subscription = this.save().subscribe({
      next: () => {
        this.isSaving = false;
        this.saved.emit();
      },
      error: () => {
        this.isSaving = false;
        this.saveError = true;
      },
    });
  }

  private save(): Observable<unknown> {
    const name = this.model.name.trim();
    const dueDay = this.model.dueDay!;
    const amountType = this.model.amountType;
    const value = this.isFixed ? this.model.value : null;

    if (this.recurringBill) {
      return this.recurringBillService.update(this.recurringBill.id, {
        name,
        dueDay,
        amountType,
        fixedValue: value,
      });
    }
    if (this.model.repeats) {
      // Starts in the open month, so a recurring bill added to a past month
      // also fills the months up to the current one.
      return this.recurringBillService.create({
        name,
        dueDay,
        amountType,
        fixedValue: value,
        startMonth: dueDateInMonth(this.year, this.month, 1),
      });
    }
    return this.billService.create({
      name,
      dueDate: dueDateInMonth(this.year, this.month, dueDay),
      amountType,
      value,
    });
  }
}
