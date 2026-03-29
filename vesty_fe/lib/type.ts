export interface User {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  data?: T;
}

export interface Finance {
  id: string;
  user_id: string;
  type: 'income' | 'expense';
  amount: number;
  category: string;
  description?: string;
  date: string;
  created_at: string;
  updated_at: string;
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpense: number;
  balance: number;
}

export interface Stock {
  id: string;
  user_id: string;
  item_name: string;
  category?: string;
  current_stock: number;
  unit: string;
  created_at: string;
  updated_at: string;
}

export interface StockHistory {
  id: string;
  stock_id: string;
  type: 'in' | 'out';
  quantity: number;
  notes?: string;
  date: string;
  created_at: string;
}