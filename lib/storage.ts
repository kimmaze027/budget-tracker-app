import AsyncStorage from "@react-native-async-storage/async-storage";

// Storage keys
const TRANSACTIONS_KEY = "budget_transactions";
const CATEGORIES_KEY = "budget_categories";
const INITIALIZED_KEY = "budget_initialized";

// Types
export type TransactionType = "income" | "expense";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  color: string;
  icon: string;
}

export interface Transaction {
  id: string;
  categoryId: string;
  amount: number;
  type: TransactionType;
  date: string;
  note?: string;
  createdAt: string;
}

// Default categories
const DEFAULT_CATEGORIES: Category[] = [
  // Income categories
  { id: "cat_1", name: "급여", type: "income", color: "#10B981", icon: "💰" },
  { id: "cat_2", name: "부수입", type: "income", color: "#34D399", icon: "💵" },
  { id: "cat_3", name: "기타수입", type: "income", color: "#6EE7B7", icon: "📈" },
  
  // Expense categories
  { id: "cat_4", name: "식비", type: "expense", color: "#EF4444", icon: "🍔" },
  { id: "cat_5", name: "교통비", type: "expense", color: "#F87171", icon: "🚗" },
  { id: "cat_6", name: "쇼핑", type: "expense", color: "#FCA5A5", icon: "🛍️" },
  { id: "cat_7", name: "문화생활", type: "expense", color: "#FB923C", icon: "🎬" },
  { id: "cat_8", name: "의료", type: "expense", color: "#FBBF24", icon: "🏥" },
  { id: "cat_9", name: "교육", type: "expense", color: "#A78BFA", icon: "📚" },
  { id: "cat_10", name: "기타지출", type: "expense", color: "#94A3B8", icon: "💸" },
];

// Initialize storage with default data
export async function initializeStorage(): Promise<void> {
  try {
    const initialized = await AsyncStorage.getItem(INITIALIZED_KEY);
    if (initialized) {
      console.log("[Storage] Already initialized");
      return;
    }

    // Set default categories
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(DEFAULT_CATEGORIES));
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify([]));
    await AsyncStorage.setItem(INITIALIZED_KEY, "true");
    
    console.log("[Storage] Initialized with default categories");
  } catch (error) {
    console.error("[Storage] Failed to initialize:", error);
  }
}

// Categories
export async function getCategories(): Promise<Category[]> {
  try {
    const data = await AsyncStorage.getItem(CATEGORIES_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error("[Storage] Failed to get categories:", error);
    return [];
  }
}

export async function saveCategory(category: Category): Promise<void> {
  try {
    const categories = await getCategories();
    const existingIndex = categories.findIndex((c) => c.id === category.id);
    
    if (existingIndex >= 0) {
      categories[existingIndex] = category;
    } else {
      categories.push(category);
    }
    
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (error) {
    console.error("[Storage] Failed to save category:", error);
    throw error;
  }
}

export async function deleteCategory(categoryId: string): Promise<void> {
  try {
    const categories = await getCategories();
    const filtered = categories.filter((c) => c.id !== categoryId);
    await AsyncStorage.setItem(CATEGORIES_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[Storage] Failed to delete category:", error);
    throw error;
  }
}

// Transactions
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const data = await AsyncStorage.getItem(TRANSACTIONS_KEY);
    const transactions = data ? JSON.parse(data) : [];
    // Sort by date descending
    return transactions.sort((a: Transaction, b: Transaction) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );
  } catch (error) {
    console.error("[Storage] Failed to get transactions:", error);
    return [];
  }
}

export async function saveTransaction(transaction: Transaction): Promise<void> {
  try {
    const transactions = await getTransactions();
    const existingIndex = transactions.findIndex((t) => t.id === transaction.id);
    
    if (existingIndex >= 0) {
      transactions[existingIndex] = transaction;
    } else {
      transactions.push(transaction);
    }
    
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(transactions));
  } catch (error) {
    console.error("[Storage] Failed to save transaction:", error);
    throw error;
  }
}

export async function deleteTransaction(transactionId: string): Promise<void> {
  try {
    const transactions = await getTransactions();
    const filtered = transactions.filter((t) => t.id !== transactionId);
    await AsyncStorage.setItem(TRANSACTIONS_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error("[Storage] Failed to delete transaction:", error);
    throw error;
  }
}

// Statistics
export async function getMonthlySummary(year: number, month: number) {
  try {
    const transactions = await getTransactions();
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);
    
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
    
    const income = filtered
      .filter((t) => t.type === "income")
      .reduce((sum, t) => sum + t.amount, 0);
    
    const expense = filtered
      .filter((t) => t.type === "expense")
      .reduce((sum, t) => sum + t.amount, 0);
    
    return {
      income,
      expense,
      balance: income - expense,
    };
  } catch (error) {
    console.error("[Storage] Failed to get monthly summary:", error);
    return { income: 0, expense: 0, balance: 0 };
  }
}

export async function getCategoryStats(startDate: Date, endDate: Date) {
  try {
    const transactions = await getTransactions();
    const categories = await getCategories();
    
    const filtered = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= startDate && date <= endDate;
    });
    
    const stats = new Map<string, { categoryId: string; categoryName: string; type: TransactionType; total: number }>();
    
    filtered.forEach((t) => {
      const category = categories.find((c) => c.id === t.categoryId);
      const key = t.categoryId;
      
      if (!stats.has(key)) {
        stats.set(key, {
          categoryId: t.categoryId,
          categoryName: category?.name || "Unknown",
          type: t.type,
          total: 0,
        });
      }
      
      const stat = stats.get(key)!;
      stat.total += t.amount;
    });
    
    return Array.from(stats.values()).sort((a, b) => b.total - a.total);
  } catch (error) {
    console.error("[Storage] Failed to get category stats:", error);
    return [];
  }
}

// Clear all data
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.multiRemove([TRANSACTIONS_KEY, CATEGORIES_KEY, INITIALIZED_KEY]);
    console.log("[Storage] All data cleared");
  } catch (error) {
    console.error("[Storage] Failed to clear data:", error);
    throw error;
  }
}
