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
  reference_id?: string | null;
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
  reference_id?: string | null;
}
export interface DebtItem {
  id: string;
  debt_id: string;
  item_name: string;
  quantity: number;
  unit: string;
  price_per_unit?: number;
  total_price?: number;
  created_at: string;
  category?: string | null;
}

export interface DebtMoney {
  id: string;
  debt_id: string;
  amount: number;
  created_at: string;
}

export interface DebtPayment {
  id: string;
  debt_id: string;
  amount: number;
  payment_type: 'money' | 'item';
  notes?: string;
  date: string;
  created_at: string;
}

export interface Debt {
  id: string;
  user_id: string;
  debtor_name: string;
  type: 'money' | 'item';
  status: 'unpaid' | 'partial' | 'paid';
  notes?: string;
  date: string;
  due_date?: string;
  created_at: string;
  updated_at: string;
  debt_items: DebtItem[];
  debt_money?: DebtMoney;
  debt_payments: DebtPayment[];
}

export interface DebtSummary {
  totalDebts: number;
  unpaidCount: number;
  partialCount: number;
  paidCount: number;
  totalUnpaid: number;
  totalPartial: number;
  totalPaid: number;
}