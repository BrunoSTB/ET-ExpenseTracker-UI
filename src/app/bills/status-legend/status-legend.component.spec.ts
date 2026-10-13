import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusLegendComponent } from './status-legend.component';
import { getTranslocoModule } from '../../../testing/transloco-testing';

describe('StatusLegendComponent', () => {
  let fixture: ComponentFixture<StatusLegendComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusLegendComponent, getTranslocoModule()],
    }).compileComponents();

    fixture = TestBed.createComponent(StatusLegendComponent);
    fixture.detectChanges();
  });

  it('should list every status with its color and label', () => {
    const items: HTMLElement[] = Array.from(
      fixture.nativeElement.querySelectorAll('.legend-item')
    );

    expect(items.map((item) => item.querySelector('.legend-label')?.textContent)).toEqual([
      'Atrasada',
      'Vence em breve',
      'Pendente',
      'Paga',
      'Próxima',
    ]);
    expect(items[0].querySelector('.status-dot')?.classList).toContain('status-overdue');
    expect(items[1].querySelector('.status-dot')?.classList).toContain('status-dueSoon');
  });
});
