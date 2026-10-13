import { Pipe, PipeTransform } from "@angular/core";
import { UserPreferences } from "../types/userPreferences";
import { DateFormat, formatDate } from "./format";

// {{ bill.dueDate | localDate: preferences }} or
// {{ bill.dueDate | localDate: preferences : 'monthYear' }}
@Pipe({
  name: "localDate",
})
export class LocalDatePipe implements PipeTransform {
  transform(
    date: string | Date | null | undefined,
    preferences: UserPreferences,
    format: DateFormat = "dayMonth"
  ) {
    if (date === null || date === undefined) {
      return "";
    }
    return formatDate(date, preferences.locale, format);
  }
}
