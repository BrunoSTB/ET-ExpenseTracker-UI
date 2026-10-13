import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { TranslocoPipe } from '@jsverse/transloco';
import { PreferencesService } from '../../services/preferences.service';
import { AVAILABLE_LANGS } from '../../i18n/transloco';

export const CURRENCIES = ['BRL', 'USD', 'EUR', 'GBP'];

// Collapsible menu to pick the currency and the language (`locale`), saved
// with `PUT User/Preferences`. Only pt-BR is available as a language for now.
@Component({
  selector: 'app-preferences-menu',
  standalone: true,
  imports: [FormsModule, TranslocoPipe],
  templateUrl: './preferences-menu.component.html',
  changeDetection: ChangeDetectionStrategy.Eager,
  styleUrl: './preferences-menu.component.css'
})
export class PreferencesMenuComponent implements OnInit, OnDestroy {
  isOpen = false;
  currencies = CURRENCIES;
  languages = AVAILABLE_LANGS;
  model = { currency: '', locale: '' };
  isSaving = false;
  saved = false;
  saveError = false;

  private subscriptions = new Subscription();
  private saveSubscription?: Subscription;

  constructor(private preferencesService: PreferencesService) {}

  ngOnInit(): void {
    this.subscriptions.add(
      this.preferencesService.getPreferences().subscribe((preferences) => {
        this.model = { ...preferences };
        // Keep a value saved elsewhere selectable instead of showing a blank select.
        this.currencies = withOption(CURRENCIES, preferences.currency);
        this.languages = withOption(AVAILABLE_LANGS, preferences.locale);
      })
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
    this.saveSubscription?.unsubscribe();
  }

  toggle() {
    this.isOpen = !this.isOpen;
    this.saved = false;
    this.saveError = false;
  }

  onSubmit() {
    if (this.isSaving) {
      return;
    }
    this.isSaving = true;
    this.saved = false;
    this.saveError = false;
    this.saveSubscription = this.preferencesService.update({ ...this.model }).subscribe({
      next: () => {
        this.isSaving = false;
        this.saved = true;
      },
      error: () => {
        this.isSaving = false;
        this.saveError = true;
      },
    });
  }
}

function withOption(options: string[], value: string) {
  return options.includes(value) ? options : [...options, value];
}
