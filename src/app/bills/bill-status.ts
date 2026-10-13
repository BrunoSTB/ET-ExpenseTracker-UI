import { parseIsoDate } from "../formatting/format";
import { Bill } from "../types/bill";
import { BillMonth } from "../types/billMonth";

// Status rules for the bills screen. Pure functions that take `today` as a
// parameter, so specs can pin the date. Texts are returned as translation
// keys (with params) and rendered with Transloco by the components.

export type BillStatus = "overdue" | "dueSoon" | "pending" | "paid" | "upcoming";

export const BILL_STATUSES: BillStatus[] = [
  "overdue",
  "dueSoon",
  "pending",
  "paid",
  "upcoming",
];

// A bill is "due soon" when it is due today or within the next N days.
export const DUE_SOON_DAYS = 3;

export interface TranslatedText {
  key: string;
  params?: Record<string, number | string>;
}

export interface MonthTotals {
  paid: number;
  // Unpaid bills, using the estimate when there is no value yet.
  leftToPay: number;
  // The overdue part of leftToPay.
  overdue: number;
  // "Bills this month": paid + leftToPay.
  total: number;
}

export type MonthCounts = Record<BillStatus, number> & { total: number };

// Whole days from `from` to `to` (negative when `to` is earlier). Uses UTC
// of the calendar dates, so daylight saving changes don't skew the result.
export function daysBetween(from: Date, to: Date) {
  const fromUtc = Date.UTC(from.getFullYear(), from.getMonth(), from.getDate());
  const toUtc = Date.UTC(to.getFullYear(), to.getMonth(), to.getDate());
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

export function isPaid(bill: Bill) {
  return bill.paidAt !== null;
}

// A bill due within the next few days is "dueSoon" even if that falls in the
// next month; otherwise any unpaid bill of a future month is "upcoming".
export function getStatus(bill: Bill, today: Date): BillStatus {
  if (isPaid(bill)) {
    return "paid";
  }

  const dueDate = parseIsoDate(bill.dueDate);
  const daysLeft = daysBetween(today, dueDate);

  if (daysLeft < 0) {
    return "overdue";
  }
  if (daysLeft <= DUE_SOON_DAYS) {
    return "dueSoon";
  }

  const monthsAhead =
    (dueDate.getFullYear() - today.getFullYear()) * 12 +
    (dueDate.getMonth() - today.getMonth());
  return monthsAhead > 0 ? "upcoming" : "pending";
}

// The relative part of the due text ("3 days late", "in 2 days", "today").
// Null for paid bills (they show the payment date) and for bills that are not
// overdue nor due soon, which only show the due date.
export function getDueText(bill: Bill, today: Date): TranslatedText | null {
  const status = getStatus(bill, today);
  const days = daysBetween(today, parseIsoDate(bill.dueDate));

  if (status === "overdue") {
    return days === -1
      ? { key: "bills.due.lateOne" }
      : { key: "bills.due.late", params: { days: -days } };
  }
  if (status === "dueSoon") {
    if (days === 0) {
      return { key: "bills.due.today" };
    }
    if (days === 1) {
      return { key: "bills.due.tomorrow" };
    }
    return { key: "bills.due.inDays", params: { days } };
  }
  return null;
}

// The amount to count for a bill: its value or, while there is none, its
// estimate. Null when it has neither.
export function getAmount(bill: Bill): number | null {
  return bill.value ?? bill.estimate ?? null;
}

// True when the amount shown is an estimate ("~R$ 127,43").
export function isEstimated(bill: Bill) {
  return bill.value === null && bill.estimate !== null;
}

export function getMonthTotals(bills: Bill[], today: Date): MonthTotals {
  const totals: MonthTotals = { paid: 0, leftToPay: 0, overdue: 0, total: 0 };

  for (const bill of bills) {
    const amount = getAmount(bill);
    if (amount === null) {
      continue;
    }

    const status = getStatus(bill, today);
    if (status === "paid") {
      totals.paid += amount;
    } else {
      totals.leftToPay += amount;
      if (status === "overdue") {
        totals.overdue += amount;
      }
    }
  }

  totals.total = totals.paid + totals.leftToPay;
  return totals;
}

export function getMonthCounts(bills: Bill[], today: Date): MonthCounts {
  const counts: MonthCounts = {
    total: bills.length,
    overdue: 0,
    dueSoon: 0,
    pending: 0,
    paid: 0,
    upcoming: 0,
  };

  for (const bill of bills) {
    counts[getStatus(bill, today)]++;
  }

  return counts;
}

// Summary of a month card in the strip: "All paid", "N overdue" or "N bills".
export function getMonthSummary(counts: MonthCounts): TranslatedText {
  if (counts.total === 0) {
    return { key: "bills.summary.empty" };
  }
  if (counts.paid === counts.total) {
    return { key: "bills.summary.allPaid" };
  }
  if (counts.overdue > 0) {
    return counts.overdue === 1
      ? { key: "bills.summary.overdueOne" }
      : { key: "bills.summary.overdue", params: { count: counts.overdue } };
  }
  return counts.total === 1
    ? { key: "bills.summary.billsOne" }
    : { key: "bills.summary.bills", params: { count: counts.total } };
}

// "N overdue this year".
export function countOverdueInYear(months: BillMonth[], today: Date) {
  return months.reduce(
    (count, month) =>
      count +
      month.bills.filter((bill) => getStatus(bill, today) === "overdue").length,
    0
  );
}

// Sorted by due date, then by name, without mutating the input.
export function sortByDueDate(bills: Bill[]) {
  return [...bills].sort(
    (a, b) => a.dueDate.localeCompare(b.dueDate) || a.name.localeCompare(b.name)
  );
}

// Unpaid bills of a recurring bill due from the first day of today's month on,
// i.e. the ones removed when it stops being tracked. Only counts the loaded
// months.
export function countUnpaidFromCurrentMonth(
  months: BillMonth[],
  recurringBillId: number,
  today: Date
) {
  const firstOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  return months.reduce(
    (count, month) =>
      count +
      month.bills.filter(
        (bill) =>
          bill.recurringBillId === recurringBillId &&
          !isPaid(bill) &&
          daysBetween(firstOfMonth, parseIsoDate(bill.dueDate)) >= 0
      ).length,
    0
  );
}

// ISO due date of a bill in a 1-based month. Months without `dueDay` use their
// last day, like the server does for recurring bills.
export function dueDateInMonth(year: number, month: number, dueDay: number) {
  const lastDay = new Date(year, month, 0).getDate();
  const day = Math.min(dueDay, lastDay);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
