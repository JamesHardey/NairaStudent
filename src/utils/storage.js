import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  DAILY_LIMIT: "@naira_student_daily_limit",
  EXPENSES: "@naira_student_expenses",
  CATEGORIES: "@naira_student_categories",
  AI_SETTINGS: "@naira_student_ai_settings",
};

import { DEFAULT_CATEGORIES } from "../constants/categories";
import { Utensils, Car, Wifi, Printer, MoreHorizontal, ShoppingBag, Book, Coffee, Gift, Music, CircleDollarSign } from "lucide-react-native";

const ICON_MAP = {
  Utensils,
  Car,
  Wifi,
  Printer,
  MoreHorizontal,
  ShoppingBag,
  Book,
  Coffee,
  Gift,
  Music,
  CircleDollarSign
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

// Category Management
export const getCategories = async () => {
  try {
    const savedCategoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const savedCategories = savedCategoriesJson ? JSON.parse(savedCategoriesJson) : [];
    
    // Hydrate icons for saved categories
    const hydratedSavedCategories = savedCategories.map(cat => ({
      ...cat,
      icon: ICON_MAP[cat.iconName] || CircleDollarSign, // Default icon
    }));

    // Return combined categories (Defaults + Custom)
    return [...DEFAULT_CATEGORIES, ...hydratedSavedCategories];
  } catch (error) {
    console.error("Error getting categories:", error);
    return DEFAULT_CATEGORIES;
  }
};

export const saveCategory = async (category) => {
  try {
    const savedCategoriesJson = await AsyncStorage.getItem(STORAGE_KEYS.CATEGORIES);
    const savedCategories = savedCategoriesJson ? JSON.parse(savedCategoriesJson) : [];
    
    // We only save the serializable parts (no icon component)
    const newCategoryToSave = {
      id: category.id,
      name: category.name,
      iconName: category.iconName || 'CircleDollarSign',
      lightColor: category.lightColor,
      darkColor: category.darkColor,
    };

    const updatedCategories = [...savedCategories, newCategoryToSave];
    
    await AsyncStorage.setItem(
      STORAGE_KEYS.CATEGORIES,
      JSON.stringify(updatedCategories)
    );
    return true;
  } catch (error) {
    console.error("Error saving category:", error);
    return false;
  }
};

// AI Settings Management
export const saveAISettings = async (settings) => {
  try {
    const current = await getAISettings();
    const newSettings = { ...current, ...settings };
    await AsyncStorage.setItem(STORAGE_KEYS.AI_SETTINGS, JSON.stringify(newSettings));
    return true;
  } catch (error) {
    console.error("Error saving AI settings:", error);
    return false;
  }
};

export const getAISettings = async () => {
  try {
    const settings = await AsyncStorage.getItem(STORAGE_KEYS.AI_SETTINGS);
    return settings ? JSON.parse(settings) : { enabled: false, apiKey: "" };
  } catch (error) {
    console.error("Error getting AI settings:", error);
    return { enabled: false, apiKey: "" };
  }
};
