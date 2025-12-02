import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  DAILY_LIMIT: "@naira_student_daily_limit",
  EXPENSES: "@naira_student_expenses",
};

// Budget Management
export const saveDailyLimit = async (limit) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.DAILY_LIMIT, limit.toString());
    return true;
  } catch (error) {
    console.error("Error saving daily limit:", error);
    return false;
  }
};

export const getDailyLimit = async () => {
  try {
    const limit = await AsyncStorage.getItem(STORAGE_KEYS.DAILY_LIMIT);
    return limit ? parseFloat(limit) : 5000; // Default ₦5,000
  } catch (error) {
    console.error("Error getting daily limit:", error);
    return 5000;
  }
};

// Expense Management
export const saveExpense = async (expense) => {
  try {
    const existingExpenses = await getExpenses();
    const newExpense = {
      id: Date.now().toString(),
      ...expense,
      date: expense.date || new Date().toISOString(),
    };
    const updatedExpenses = [...existingExpenses, newExpense];
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXPENSES,
      JSON.stringify(updatedExpenses),
    );
    return newExpense;
  } catch (error) {
    console.error("Error saving expense:", error);
    return null;
  }
};

export const getExpenses = async () => {
  try {
    const expenses = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return expenses ? JSON.parse(expenses) : [];
  } catch (error) {
    console.error("Error getting expenses:", error);
    return [];
  }
};

export const deleteExpense = async (expenseId) => {
  try {
    const expenses = await getExpenses();
    const updatedExpenses = expenses.filter((exp) => exp.id !== expenseId);
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXPENSES,
      JSON.stringify(updatedExpenses),
    );
    return true;
  } catch (error) {
    console.error("Error deleting expense:", error);
    return false;
  }
};

export const clearAllExpenses = async () => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify([]));
    return true;
  } catch (error) {
    console.error("Error clearing expenses:", error);
    return false;
  }
};

// Update an existing expense
export const updateExpense = async (expenseId, updatedData) => {
  try {
    const expenses = await getExpenses();
    const expenseIndex = expenses.findIndex((exp) => exp.id === expenseId);
    
    if (expenseIndex === -1) {
      return false;
    }
    
    expenses[expenseIndex] = {
      ...expenses[expenseIndex],
      ...updatedData,
    };
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.EXPENSES,
      JSON.stringify(expenses),
    );
    return true;
  } catch (error) {
    console.error("Error updating expense:", error);
    return false;
  }
};
