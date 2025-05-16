import { Expense } from "./expenses";

export interface ExpenseList {
    userId: number;
    expensesMonth: number;
    totalExpenses: number;
    expenses: Expense[];
}