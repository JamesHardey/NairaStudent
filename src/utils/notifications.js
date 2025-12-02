import { Platform } from "react-native";
import Constants from "expo-constants";

// Notifications are not supported in Expo Go for SDK 53+
// They work in development builds and production apps
let Notifications = null;

// Only load notifications if NOT in Expo Go
const isExpoGo = Constants.appOwnership === "expo";

if (!isExpoGo) {
  try {
    Notifications = require("expo-notifications");
    
    // Configure notification handler
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  } catch (error) {
    console.log("Notifications module not available");
  }
} else {
  console.log("Running in Expo Go - notifications disabled (will work in production build)");
}

// Request notification permissions
export const requestNotificationPermissions = async () => {
  if (!Notifications) {
    console.log("Notifications not available");
    return false;
  }
  
  try {
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      console.log("Notification permission not granted");
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error requesting notification permissions:", error);
    return false;
  }
};

// Schedule a local notification
export const scheduleLocalNotification = async (title, body, data = {}) => {
  if (!Notifications) {
    console.log("Notification:", title, "-", body);
    return null;
  }
  
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return null;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
      },
      trigger: null, // Show immediately
    });

    return id;
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return null;
  }
};

// Check budget threshold and send alerts
export const checkBudgetThreshold = async (
  dailyLimit,
  dailyTotal,
  lastAlertLevel = 0,
) => {
  const percentage = (dailyTotal / dailyLimit) * 100;
  let alertLevel = lastAlertLevel;

  if (percentage >= 90 && lastAlertLevel < 90) {
    await scheduleLocalNotification(
      "⚠️ Budget Alert!",
      `You've spent 90% of your daily budget (${formatAmount(dailyTotal)} / ${formatAmount(dailyLimit)}). Only ${formatAmount(dailyLimit - dailyTotal)} remaining!`,
      { type: "budget-alert", level: 90 },
    );
    alertLevel = 90;
  } else if (percentage >= 75 && lastAlertLevel < 75) {
    await scheduleLocalNotification(
      "💰 Budget Warning",
      `You've spent 75% of your daily budget. ${formatAmount(dailyLimit - dailyTotal)} left for today.`,
      { type: "budget-alert", level: 75 },
    );
    alertLevel = 75;
  } else if (percentage >= 50 && lastAlertLevel < 50) {
    await scheduleLocalNotification(
      "📊 Budget Update",
      `You've reached halfway through your daily budget. ${formatAmount(dailyLimit - dailyTotal)} remaining.`,
      { type: "budget-alert", level: 50 },
    );
    alertLevel = 50;
  }

  return alertLevel;
};

// Send daily summary notification
export const sendDailySummary = async (dailyTotal, dailyLimit, expenseCount) => {
  const remaining = dailyLimit - dailyTotal;
  const percentage = (dailyTotal / dailyLimit) * 100;

  let emoji = "✅";
  let message = "Great job staying under budget!";

  if (percentage >= 100) {
    emoji = "🔴";
    message = "You went over budget today!";
  } else if (percentage >= 80) {
    emoji = "⚠️";
    message = "Close to your budget limit!";
  }

  await scheduleLocalNotification(
    `${emoji} Daily Summary`,
    `Spent ${formatAmount(dailyTotal)} out of ${formatAmount(dailyLimit)} (${expenseCount} transactions). ${message}`,
    { type: "daily-summary" },
  );
};

// Helper to format amounts
const formatAmount = (amount) => {
  return `₦${amount.toLocaleString("en-NG", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

// Cancel all scheduled notifications
export const cancelAllNotifications = async () => {
  if (!Notifications) return;
  
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error("Error canceling notifications:", error);
  }
};
