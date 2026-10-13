import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TranslocoPipe } from '@jsverse/transloco';
import { BILL_STATUSES } from '../bill-status';

@Component({
  selector: 'app-status-legend',
  standalone: true,
  imports: [TranslocoPipe],
  templateUrl: './status-legend.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './status-legend.component.css'
})
export class StatusLegendComponent {
  statuses = BILL_STATUSES;
}
