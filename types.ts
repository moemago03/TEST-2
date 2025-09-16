export interface CategoryBudget {
  categoryName: string;
  amount: number;
}

export interface FrequentExpense {
  id: string;
  name: string;
  icon: string;
  category: string;
  amount: number;
}

export interface Expense {
  id: string;
  amount: number;
  currency: string;
  category: string;
  description: string;
  date: string; // ISO string
  country?: string;
}

export interface Trip {
  id: string;
  name: string;
  startDate: string; // ISO string
  endDate: string; // ISO string
  totalBudget: number;
  countries: string[];
  preferredCurrencies: string[];
  mainCurrency: string;
  expenses: Expense[];
  frequentExpenses?: FrequentExpense[];
  enableCategoryBudgets?: boolean;
  categoryBudgets?: CategoryBudget[];
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface UserData {
  trips: Trip[];
  categories: Category[];
}