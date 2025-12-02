// Format currency in Naira with commas
export const formatNaira = (amount) => {
  const num = parseFloat(amount) || 0;
  return `₦${num.toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

// Get today's date in YYYY-MM-DD format
export const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split("T")[0];
};

// Check if a date is today
export const isToday = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return date.toISOString().split("T")[0] === today.toISOString().split("T")[0];
};

// Calculate total expenses for today
export const calculateDailyTotal = (expenses) => {
  const todayExpenses = expenses.filter((exp) => isToday(exp.date));
  return todayExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
};

// Calculate remaining balance
export const calculateRemainingBalance = (dailyLimit, expenses) => {
  const dailyTotal = calculateDailyTotal(expenses);
  return dailyLimit - dailyTotal;
};

// Calculate progress percentage
export const calculateProgressPercentage = (dailyLimit, expenses) => {
  const dailyTotal = calculateDailyTotal(expenses);
  if (dailyLimit === 0) return 0;
  return Math.min((dailyTotal / dailyLimit) * 100, 100);
};

// Check if budget is in danger zone (< 20% remaining)
export const isInDangerZone = (dailyLimit, expenses) => {
  const remaining = calculateRemainingBalance(dailyLimit, expenses);
  return remaining < dailyLimit * 0.2;
};

// Get status color based on remaining balance
export const getStatusColor = (dailyLimit, expenses, isDark = false) => {
  const inDanger = isInDangerZone(dailyLimit, expenses);

  if (inDanger) {
    return {
      background: isDark ? "#4A2C2A" : "#FFE8E2",
      text: isDark ? "#FF6B6B" : "#DC2626",
      border: isDark ? "#FF6B6B" : "#DC2626",
    };
  }

  return {
    background: isDark ? "#1A4D2E" : "#CBFACF",
    text: isDark ? "#4ADE80" : "#16A34A",
    border: isDark ? "#4ADE80" : "#16A34A",
  };
};

// Calculate category breakdown for pie chart
export const calculateCategoryBreakdown = (expenses) => {
  const todayExpenses = expenses.filter((exp) => isToday(exp.date));

  const breakdown = todayExpenses.reduce((acc, exp) => {
    const category = exp.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(exp.amount);
    return acc;
  }, {});

  return Object.entries(breakdown).map(([category, amount]) => ({
    category,
    amount,
    percentage:
      todayExpenses.length > 0
        ? (amount / calculateDailyTotal(expenses)) * 100
        : 0,
  }));
};

// Check if a date is within the current week
export const isThisWeek = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
  firstDayOfWeek.setHours(0, 0, 0, 0);
  const lastDayOfWeek = new Date(firstDayOfWeek);
  lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
  lastDayOfWeek.setHours(23, 59, 59, 999);
  return date >= firstDayOfWeek && date <= lastDayOfWeek;
};

// Check if a date is within the current month
export const isThisMonth = (dateString) => {
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

// Calculate total expenses for this week
export const calculateWeeklyTotal = (expenses) => {
  const weekExpenses = expenses.filter((exp) => isThisWeek(exp.date));
  return weekExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
};

// Calculate total expenses for this month
export const calculateMonthlyTotal = (expenses) => {
  const monthExpenses = expenses.filter((exp) => isThisMonth(exp.date));
  return monthExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
};

// Calculate daily average for the week
export const calculateWeeklyAverage = (expenses) => {
  const weekExpenses = expenses.filter((exp) => isThisWeek(exp.date));
  if (weekExpenses.length === 0) return 0;
  
  // Group expenses by day
  const dailyTotals = weekExpenses.reduce((acc, exp) => {
    const day = new Date(exp.date).toISOString().split("T")[0];
    if (!acc[day]) acc[day] = 0;
    acc[day] += parseFloat(exp.amount);
    return acc;
  }, {});
  
  const days = Object.keys(dailyTotals).length;
  return days > 0 ? calculateWeeklyTotal(expenses) / days : 0;
};

// Calculate daily average for the month
export const calculateMonthlyAverage = (expenses) => {
  const monthExpenses = expenses.filter((exp) => isThisMonth(exp.date));
  if (monthExpenses.length === 0) return 0;
  
  // Group expenses by day
  const dailyTotals = monthExpenses.reduce((acc, exp) => {
    const day = new Date(exp.date).toISOString().split("T")[0];
    if (!acc[day]) acc[day] = 0;
    acc[day] += parseFloat(exp.amount);
    return acc;
  }, {});
  
  const days = Object.keys(dailyTotals).length;
  return days > 0 ? calculateMonthlyTotal(expenses) / days : 0;
};

// Get expenses grouped by day for the week
export const getWeeklyExpensesByDay = (expenses) => {
  const weekExpenses = expenses.filter((exp) => isThisWeek(exp.date));
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  const grouped = weekExpenses.reduce((acc, exp) => {
    const date = new Date(exp.date);
    const dayIndex = date.getDay();
    const dayName = days[dayIndex];
    if (!acc[dayName]) acc[dayName] = 0;
    acc[dayName] += parseFloat(exp.amount);
    return acc;
  }, {});
  
  // Ensure all days are present
  return days.map(day => ({
    day,
    amount: grouped[day] || 0
  }));
};

// Get top spending categories for a period
export const getTopCategories = (expenses, period = 'week') => {
  const filteredExpenses = period === 'week' 
    ? expenses.filter(exp => isThisWeek(exp.date))
    : expenses.filter(exp => isThisMonth(exp.date));
  
  const breakdown = filteredExpenses.reduce((acc, exp) => {
    const category = exp.category;
    if (!acc[category]) {
      acc[category] = 0;
    }
    acc[category] += parseFloat(exp.amount);
    return acc;
  }, {});
  
  return Object.entries(breakdown)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
};

// Calculate spending trend (increasing/decreasing)
export const getSpendingTrend = (expenses) => {
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const todayTotal = expenses
    .filter(exp => isToday(exp.date))
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  const yesterdayTotal = expenses
    .filter(exp => {
      const expDate = new Date(exp.date);
      return expDate.toISOString().split("T")[0] === yesterday.toISOString().split("T")[0];
    })
    .reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  
  if (yesterdayTotal === 0) return { trend: 'neutral', percentage: 0 };
  
  const percentageChange = ((todayTotal - yesterdayTotal) / yesterdayTotal) * 100;
  
  return {
    trend: percentageChange > 0 ? 'increasing' : percentageChange < 0 ? 'decreasing' : 'neutral',
    percentage: Math.abs(percentageChange)
  };
};
