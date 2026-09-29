export class Expense {
    id: number;
    expenseDate: Date;
    name: string;
    value: number;

    constructor(_id:number, _name: string, _value: number, _date: Date) {
        this.id = _id;
        this.name = _name;
        this.value = _value;
        this.expenseDate = _date;
    }   
}

export type NewExpense = Pick<Expense, 'name' | 'value' | 'expenseDate'>;

export const expenses: Expense[] = [
    {
        id: 1,
        expenseDate: new Date(2024, 2, 4),
        name: "Aluguel",
        value: 850
    },
    {
        id: 2,
        expenseDate: new Date(2024, 2, 4),
        name: "Condomínio",
        value: 300
    },
    {
        id: 3,
        expenseDate: new Date(2024, 2, 2),
        name: "Tim",
        value: 42.99
    },
    {
        id: 4,
        expenseDate: new Date(2024, 2, 11),
        name: "Internet",
        value: 99.99
    },
    {
        id: 5,
        expenseDate: new Date(2024, 2, 13),
        name: "Energia",
        value: 155.96
    }
];