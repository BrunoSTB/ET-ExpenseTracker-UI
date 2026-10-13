import { Pipe, PipeTransform } from "@angular/core";
import { UserPreferences } from "../types/userPreferences";
import { formatCurrency, formatMissingCurrency } from "./format";

// {{ bill.value | money: preferences }}. Null or undefined renders "R$ —".
// Preferences are an argument (not injected) so the pipe stays pure and
// re-renders when the component receives new preferences.
@Pipe({
  name: "money",
})
export class MoneyPipe implements PipeTransform {
  transform(value: number | null | undefined, preferences: UserPreferences) {
    if (value === null || value === undefined) {
      return formatMissingCurrency(preferences);
    }
    return formatCurrency(value, preferences);
  }
}
