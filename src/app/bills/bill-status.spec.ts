import {
  countOverdueInYear,
  countUnpaidFromCurrentMonth,
  daysBetween,
  dueDateInMonth,
  getAmount,
  getDueText,
  getMonthCounts,
  getMonthSummary,
  getMonthTotals,
  getStatus,
  isEstimated,
  sortByDueDate,
} from './bill-status';
import { Bill } from '../types/bill';

// Wednesday, 8 Oct 2026, in the middle of the day.
const TODAY = new Date(2026, 9, 8, 15, 30);

function bill(overrides: Partial<Bill> = {}): Bill {
  return {
    id: 1,
    recurringBillId: null,
    name: 'Rent',
    dueDate: '2026-10-20',
    amountType: 'Fixed',
    value: 100,
    estimate: null,
    paidAt: null,
    canDelete: true,
    ...overrides,
  };
}

describe('bill-status', () => {
  describe('daysBetween', () => {
    it('should count calendar days, ignoring the time of day', () => {
      expect(daysBetween(TODAY, new Date(2026, 9, 8))).toBe(0);
      expect(daysBetween(TODAY, new Date(2026, 9, 11))).toBe(3);
      expect(daysBetween(TODAY, new Date(2026, 9, 5))).toBe(-3);
    });

    it('should not be skewed by daylight saving changes', () => {
      expect(daysBetween(new Date(2026, 2, 1), new Date(2026, 3, 1))).toBe(31);
      expect(daysBetween(new Date(2026, 9, 1), new Date(2026, 10, 1))).toBe(31);
    });

    it('should cross years', () => {
      expect(daysBetween(new Date(2026, 11, 31), new Date(2027, 0, 1))).toBe(1);
    });
  });

  describe('getStatus', () => {
    it('should be paid when the bill has a payment date', () => {
      expect(getStatus(bill({ paidAt: '2026-10-04' }), TODAY)).toBe('paid');
    });

    it('should be paid even if it was paid late', () => {
      expect(
        getStatus(bill({ dueDate: '2026-09-01', paidAt: '2026-10-04' }), TODAY)
      ).toBe('paid');
    });

    it('should be paid for a future month paid in advance', () => {
      expect(
        getStatus(bill({ dueDate: '2026-12-10', paidAt: '2026-10-04' }), TODAY)
      ).toBe('paid');
    });

    it('should be overdue when the due date has passed', () => {
      expect(getStatus(bill({ dueDate: '2026-10-07' }), TODAY)).toBe('overdue');
      expect(getStatus(bill({ dueDate: '2026-10-01' }), TODAY)).toBe('overdue');
    });

    it('should be overdue for unpaid bills of past months', () => {
      expect(getStatus(bill({ dueDate: '2026-03-10' }), TODAY)).toBe('overdue');
      expect(getStatus(bill({ dueDate: '2025-12-31' }), TODAY)).toBe('overdue');
    });

    it('should be due soon when due today', () => {
      expect(getStatus(bill({ dueDate: '2026-10-08' }), TODAY)).toBe('dueSoon');
    });

    it('should be due soon up to 3 days ahead', () => {
      expect(getStatus(bill({ dueDate: '2026-10-09' }), TODAY)).toBe('dueSoon');
      expect(getStatus(bill({ dueDate: '2026-10-11' }), TODAY)).toBe('dueSoon');
    });

    it('should be pending from 4 days ahead within the month', () => {
      expect(getStatus(bill({ dueDate: '2026-10-12' }), TODAY)).toBe('pending');
      expect(getStatus(bill({ dueDate: '2026-10-31' }), TODAY)).toBe('pending');
    });

    it('should be upcoming in a future month', () => {
      expect(getStatus(bill({ dueDate: '2026-11-15' }), TODAY)).toBe('upcoming');
      expect(getStatus(bill({ dueDate: '2027-01-05' }), TODAY)).toBe('upcoming');
    });

    it('should be due soon when the next month starts within 3 days', () => {
      const endOfMonth = new Date(2026, 9, 30);

      expect(getStatus(bill({ dueDate: '2026-11-02' }), endOfMonth)).toBe('dueSoon');
      expect(getStatus(bill({ dueDate: '2026-11-03' }), endOfMonth)).toBe('upcoming');
    });

    it('should be due soon across the turn of the year', () => {
      const newYearsEve = new Date(2026, 11, 31);

      expect(getStatus(bill({ dueDate: '2027-01-01' }), newYearsEve)).toBe('dueSoon');
      expect(getStatus(bill({ dueDate: '2027-01-10' }), newYearsEve)).toBe('upcoming');
    });

    it('should be upcoming in the same month of the next year', () => {
      expect(
        getStatus(bill({ dueDate: '2026-10-20' }), new Date(2025, 9, 8))
      ).toBe('upcoming');
    });
  });

  describe('getDueText', () => {
    it('should be null for paid bills', () => {
      expect(getDueText(bill({ dueDate: '2026-10-01', paidAt: '2026-10-04' }), TODAY)).toBeNull();
    });

    it('should count the days late', () => {
      expect(getDueText(bill({ dueDate: '2026-10-05' }), TODAY)).toEqual({
        key: 'bills.due.late',
        params: { days: 3 },
      });
    });

    it('should use the singular for one day late', () => {
      expect(getDueText(bill({ dueDate: '2026-10-07' }), TODAY)).toEqual({
        key: 'bills.due.lateOne',
      });
    });

    it('should say today and tomorrow', () => {
      expect(getDueText(bill({ dueDate: '2026-10-08' }), TODAY)).toEqual({
        key: 'bills.due.today',
      });
      expect(getDueText(bill({ dueDate: '2026-10-09' }), TODAY)).toEqual({
        key: 'bills.due.tomorrow',
      });
    });

    it('should count the days left when due soon', () => {
      expect(getDueText(bill({ dueDate: '2026-10-10' }), TODAY)).toEqual({
        key: 'bills.due.inDays',
        params: { days: 2 },
      });
      expect(getDueText(bill({ dueDate: '2026-10-11' }), TODAY)).toEqual({
        key: 'bills.due.inDays',
        params: { days: 3 },
      });
    });

    it('should be null for pending and upcoming bills', () => {
      expect(getDueText(bill({ dueDate: '2026-10-12' }), TODAY)).toBeNull();
      expect(getDueText(bill({ dueDate: '2026-11-12' }), TODAY)).toBeNull();
    });
  });

  describe('getAmount and isEstimated', () => {
    it('should use the value when there is one', () => {
      const withValue = bill({ value: 80, estimate: 120 });

      expect(getAmount(withValue)).toBe(80);
      expect(isEstimated(withValue)).toBeFalse();
    });

    it('should fall back to the estimate', () => {
      const estimated = bill({ amountType: 'VariableEstimated', value: null, estimate: 127.43 });

      expect(getAmount(estimated)).toBe(127.43);
      expect(isEstimated(estimated)).toBeTrue();
    });

    it('should be null without value nor estimate', () => {
      const missing = bill({ amountType: 'VariableOnArrival', value: null, estimate: null });

      expect(getAmount(missing)).toBeNull();
      expect(isEstimated(missing)).toBeFalse();
    });

    it('should keep a zero value', () => {
      expect(getAmount(bill({ value: 0, estimate: 50 }))).toBe(0);
    });
  });

  describe('getMonthTotals', () => {
    it('should be zero without bills', () => {
      expect(getMonthTotals([], TODAY)).toEqual({
        paid: 0,
        leftToPay: 0,
        overdue: 0,
        total: 0,
      });
    });

    it('should split paid and left to pay', () => {
      const bills = [
        bill({ value: 1500, paidAt: '2026-10-04' }),
        bill({ value: 200, dueDate: '2026-10-05' }),
        bill({ value: 300, dueDate: '2026-10-10' }),
        bill({ value: 50, dueDate: '2026-10-25' }),
      ];

      expect(getMonthTotals(bills, TODAY)).toEqual({
        paid: 1500,
        leftToPay: 550,
        overdue: 200,
        total: 2050,
      });
    });

    it('should use the estimate when there is no value', () => {
      const bills = [
        bill({ amountType: 'VariableEstimated', value: null, estimate: 127.5 }),
        bill({ value: 100 }),
      ];

      expect(getMonthTotals(bills, TODAY).leftToPay).toBe(227.5);
    });

    it('should count an overdue estimate as overdue', () => {
      const bills = [
        bill({ amountType: 'VariableEstimated', dueDate: '2026-10-01', value: null, estimate: 90 }),
      ];

      expect(getMonthTotals(bills, TODAY).overdue).toBe(90);
    });

    it('should ignore bills without value nor estimate', () => {
      const bills = [
        bill({ amountType: 'VariableOnArrival', value: null, estimate: null }),
        bill({ amountType: 'VariableOnArrival', dueDate: '2026-10-01', value: null, estimate: null }),
        bill({ value: 100 }),
      ];

      expect(getMonthTotals(bills, TODAY)).toEqual({
        paid: 0,
        leftToPay: 100,
        overdue: 0,
        total: 100,
      });
    });

    it('should count the paid value, not the estimate', () => {
      const bills = [
        bill({ amountType: 'VariableEstimated', value: 140, estimate: 120, paidAt: '2026-10-02' }),
      ];

      expect(getMonthTotals(bills, TODAY).paid).toBe(140);
    });

    it('should count upcoming bills as left to pay', () => {
      const bills = [bill({ dueDate: '2026-11-20', value: 70 })];

      expect(getMonthTotals(bills, TODAY)).toEqual({
        paid: 0,
        leftToPay: 70,
        overdue: 0,
        total: 70,
      });
    });
  });

  describe('getMonthCounts', () => {
    it('should count bills by status', () => {
      const bills = [
        bill({ paidAt: '2026-10-04' }),
        bill({ paidAt: '2026-10-05' }),
        bill({ dueDate: '2026-10-05' }),
        bill({ dueDate: '2026-10-09' }),
        bill({ dueDate: '2026-10-25' }),
        bill({ dueDate: '2026-11-25' }),
      ];

      expect(getMonthCounts(bills, TODAY)).toEqual({
        total: 6,
        paid: 2,
        overdue: 1,
        dueSoon: 1,
        pending: 1,
        upcoming: 1,
      });
    });

    it('should count bills without an amount too', () => {
      const bills = [bill({ amountType: 'VariableOnArrival', value: null })];

      expect(getMonthCounts(bills, TODAY).total).toBe(1);
      expect(getMonthCounts(bills, TODAY).pending).toBe(1);
    });
  });

  describe('getMonthSummary', () => {
    const counts = (overrides = {}) => ({
      total: 0,
      overdue: 0,
      dueSoon: 0,
      pending: 0,
      paid: 0,
      upcoming: 0,
      ...overrides,
    });

    it('should say when there are no bills', () => {
      expect(getMonthSummary(counts())).toEqual({ key: 'bills.summary.empty' });
    });

    it('should say all paid', () => {
      expect(getMonthSummary(counts({ total: 3, paid: 3 }))).toEqual({
        key: 'bills.summary.allPaid',
      });
    });

    it('should prioritize overdue bills', () => {
      expect(getMonthSummary(counts({ total: 5, paid: 2, overdue: 2, pending: 1 }))).toEqual({
        key: 'bills.summary.overdue',
        params: { count: 2 },
      });
    });

    it('should use the singular for one bill', () => {
      expect(getMonthSummary(counts({ total: 3, overdue: 1, pending: 2 }))).toEqual({
        key: 'bills.summary.overdueOne',
      });
      expect(getMonthSummary(counts({ total: 1, pending: 1 }))).toEqual({
        key: 'bills.summary.billsOne',
      });
    });

    it('should count the bills otherwise', () => {
      expect(getMonthSummary(counts({ total: 4, paid: 1, pending: 3 }))).toEqual({
        key: 'bills.summary.bills',
        params: { count: 4 },
      });
    });
  });

  describe('countOverdueInYear', () => {
    it('should count overdue bills across months', () => {
      const months = [
        { month: 3, bills: [bill({ dueDate: '2026-03-10' }), bill({ dueDate: '2026-03-12', paidAt: '2026-03-12' })] },
        { month: 10, bills: [bill({ dueDate: '2026-10-05' }), bill({ dueDate: '2026-10-09' })] },
        { month: 11, bills: [bill({ dueDate: '2026-11-05' })] },
      ];

      expect(countOverdueInYear(months, TODAY)).toBe(2);
    });

    it('should be zero without months', () => {
      expect(countOverdueInYear([], TODAY)).toBe(0);
    });
  });

  describe('sortByDueDate', () => {
    it('should sort by due date, then name, without mutating the input', () => {
      const bills = [
        bill({ id: 1, name: 'Water', dueDate: '2026-10-10' }),
        bill({ id: 2, name: 'Rent', dueDate: '2026-10-05' }),
        bill({ id: 3, name: 'Internet', dueDate: '2026-10-10' }),
      ];

      expect(sortByDueDate(bills).map((b) => b.id)).toEqual([2, 3, 1]);
      expect(bills.map((b) => b.id)).toEqual([1, 2, 3]);
    });
  });

  describe('countUnpaidFromCurrentMonth', () => {
    it('should count the unpaid bills of the recurring bill from the current month on', () => {
      const months = [
        { month: 9, bills: [bill({ recurringBillId: 3, dueDate: '2026-09-10' })] },
        {
          month: 10,
          bills: [
            // Overdue but in the current month: removed too.
            bill({ recurringBillId: 3, dueDate: '2026-10-01' }),
            bill({ recurringBillId: 3, dueDate: '2026-10-02', paidAt: '2026-10-02' }),
            bill({ recurringBillId: 4, dueDate: '2026-10-20' }),
            bill({ recurringBillId: null, dueDate: '2026-10-20' }),
          ],
        },
        { month: 11, bills: [bill({ recurringBillId: 3, dueDate: '2026-11-01' })] },
      ];

      expect(countUnpaidFromCurrentMonth(months, 3, TODAY)).toBe(2);
    });

    it('should be zero without months', () => {
      expect(countUnpaidFromCurrentMonth([], 3, TODAY)).toBe(0);
    });
  });

  describe('dueDateInMonth', () => {
    it('should build an ISO date with padding', () => {
      expect(dueDateInMonth(2026, 3, 5)).toBe('2026-03-05');
      expect(dueDateInMonth(2026, 10, 20)).toBe('2026-10-20');
    });

    it('should use the last day of shorter months', () => {
      expect(dueDateInMonth(2026, 2, 31)).toBe('2026-02-28');
      expect(dueDateInMonth(2028, 2, 30)).toBe('2028-02-29');
      expect(dueDateInMonth(2026, 4, 31)).toBe('2026-04-30');
    });
  });
});
