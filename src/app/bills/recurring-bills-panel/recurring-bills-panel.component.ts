import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { RecurringBill } from '../../types/recurringBill';
import { UserPreferences } from '../../types/userPreferences';
import { DEFAULT_PREFERENCES } from '../../services/preferences.service';
import { MoneyPipe } from '../../formatting/money.pipe';

// Display only for now; add/edit/remove come in Phase 3.
@Component({
  selector: 'app-recurring-bills-panel',
  standalone: true,
  imports: [TranslocoPipe, MoneyPipe],
  templateUrl: './recurring-bills-panel.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './recurring-bills-panel.component.css'
})
export class RecurringBillsPanelComponent {
  @Input() recurringBills: RecurringBill[] = [];
  @Input() preferences: UserPreferences = DEFAULT_PREFERENCES;
}
