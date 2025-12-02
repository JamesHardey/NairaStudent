import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
  Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Calendar,
  TrendingUp,
  TrendingDown,
  Minus,
} from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { getExpenses } from "../../utils/storage";
import {
  formatNaira,
  calculateWeeklyTotal,
  calculateMonthlyTotal,
  calculateWeeklyAverage,
  calculateMonthlyAverage,
  getWeeklyExpensesByDay,
  getTopCategories,
  getSpendingTrend,
} from "../../utils/calculations";
import { getCategoryById } from "../../constants/categories";

const { width: screenWidth } = Dimensions.get("window");

export default function History() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week"); // 'week' or 'month'

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Roboto_400Regular,
  });

  const loadData = async () => {
    const expenseData = await getExpenses();
    setExpenses(expenseData);
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, []),
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  if (!fontsLoaded) {
    return null;
  }

  const weeklyTotal = calculateWeeklyTotal(expenses);
  const monthlyTotal = calculateMonthlyTotal(expenses);
  const weeklyAverage = calculateWeeklyAverage(expenses);
  const monthlyAverage = calculateMonthlyAverage(expenses);
  const weeklyByDay = getWeeklyExpensesByDay(expenses);
  const topCategories = getTopCategories(expenses, selectedPeriod);
  const spendingTrend = getSpendingTrend(expenses);

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
    accent: isDark ? "#4A90E2" : "#2563EB",
  };

  const maxDayAmount = Math.max(...weeklyByDay.map((d) => d.amount), 1);

  const TrendIcon =
    spendingTrend.trend === "increasing"
      ? TrendingUp
      : spendingTrend.trend === "decreasing"
        ? TrendingDown
        : Minus;
  const trendColor =
    spendingTrend.trend === "increasing"
      ? "#DC2626"
      : spendingTrend.trend === "decreasing"
        ? "#16A34A"
        : colors.secondary;

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Background Circles */}
      <View
        style={{
          position: "absolute",
          top: -80,
          right: -80,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: isDark ? "#4A90E2" : "#DBEAFE",
          opacity: isDark ? 0.4 : 0.3,
        }}
      />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingTop: insets.top + 20,
          paddingBottom: insets.bottom + 100,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={{ marginBottom: 32 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 32,
              color: colors.primary,
              marginBottom: 4,
            }}
          >
            History
          </Text>
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 16,
              color: colors.secondary,
            }}
          >
            Your spending over time
          </Text>
        </View>

        {/* Period Selector */}
        <View
          style={{
            flexDirection: "row",
            backgroundColor: colors.card,
            borderRadius: 12,
            padding: 4,
            marginBottom: 24,
          }}
        >
          <TouchableOpacity
            onPress={() => setSelectedPeriod("week")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor:
                selectedPeriod === "week" ? colors.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 14,
                color:
                  selectedPeriod === "week" ? "#FFFFFF" : colors.secondary,
                textAlign: "center",
              }}
            >
              This Week
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setSelectedPeriod("month")}
            style={{
              flex: 1,
              paddingVertical: 12,
              borderRadius: 8,
              backgroundColor:
                selectedPeriod === "month" ? colors.accent : "transparent",
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 14,
                color:
                  selectedPeriod === "month" ? "#FFFFFF" : colors.secondary,
                textAlign: "center",
              }}
            >
              This Month
            </Text>
          </TouchableOpacity>
        </View>

        {/* Summary Cards */}
        <View
          style={{
            flexDirection: "row",
            gap: 12,
            marginBottom: 24,
          }}
        >
          {/* Total Spent */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Total Spent
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 20,
                color: colors.primary,
              }}
            >
              {formatNaira(
                selectedPeriod === "week" ? weeklyTotal : monthlyTotal,
              )}
            </Text>
          </View>

          {/* Daily Average */}
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Daily Average
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 20,
                color: colors.primary,
              }}
            >
              {formatNaira(
                selectedPeriod === "week" ? weeklyAverage : monthlyAverage,
              )}
            </Text>
          </View>
        </View>

        {/* Spending Trend */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            marginBottom: 24,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <View>
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
                marginBottom: 4,
              }}
            >
              Trend vs Yesterday
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: colors.primary,
                textTransform: "capitalize",
              }}
            >
              {spendingTrend.trend}
            </Text>
          </View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TrendIcon size={24} color={trendColor} />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
                color: trendColor,
              }}
            >
              {spendingTrend.percentage.toFixed(1)}%
            </Text>
          </View>
        </View>

        {/* Weekly Chart */}
        {selectedPeriod === "week" && (
          <View
            style={{
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 20,
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 18,
                color: colors.primary,
                marginBottom: 20,
              }}
            >
              This Week's Spending
            </Text>

            <View style={{ flexDirection: "row", alignItems: "flex-end", gap: 8 }}>
              {weeklyByDay.map((dayData, index) => {
                const barHeight = maxDayAmount > 0
                  ? (dayData.amount / maxDayAmount) * 120
                  : 0;
                return (
                  <View key={index} style={{ flex: 1, alignItems: "center" }}>
                    <View
                      style={{
                        width: "100%",
                        height: Math.max(barHeight, 4),
                        backgroundColor: colors.accent,
                        borderRadius: 4,
                        marginBottom: 8,
                      }}
                    />
                    <Text
                      style={{
                        fontFamily: "Roboto_400Regular",
                        fontSize: 10,
                        color: colors.secondary,
                      }}
                    >
                      {dayData.day}
                    </Text>
                    {dayData.amount > 0 && (
                      <Text
                        style={{
                          fontFamily: "Roboto_400Regular",
                          fontSize: 9,
                          color: colors.secondary,
                          marginTop: 2,
                        }}
                      >
                        ₦{(dayData.amount / 1000).toFixed(1)}k
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Top Categories */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 20,
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            Top Spending Categories
          </Text>

          {topCategories.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Calendar size={48} color={colors.secondary} />
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 14,
                  color: colors.secondary,
                  marginTop: 16,
                  textAlign: "center",
                }}
              >
                No expenses recorded yet
              </Text>
            </View>
          ) : (
            topCategories.map((item, index) => {
              const category = getCategoryById(item.category);
              const CategoryIcon = category.icon;
              const totalAmount =
                selectedPeriod === "week" ? weeklyTotal : monthlyTotal;
              const percentage =
                totalAmount > 0 ? (item.amount / totalAmount) * 100 : 0;

              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: colors.card,
                    borderRadius: 16,
                    padding: 16,
                    marginBottom: 12,
                    flexDirection: "row",
                    alignItems: "center",
                  }}
                >
                  <View
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 12,
                      backgroundColor: isDark
                        ? category.darkColor
                        : category.lightColor,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 16,
                    }}
                  >
                    <CategoryIcon size={24} color={colors.primary} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 16,
                        color: colors.primary,
                        marginBottom: 4,
                      }}
                    >
                      {category.name}
                    </Text>
                    <View
                      style={{
                        height: 4,
                        backgroundColor: isDark ? "#1A1A1A" : "#E5E7EB",
                        borderRadius: 2,
                        overflow: "hidden",
                      }}
                    >
                      <View
                        style={{
                          height: "100%",
                          width: `${percentage}%`,
                          backgroundColor: colors.accent,
                          borderRadius: 2,
                        }}
                      />
                    </View>
                  </View>
                  <View style={{ marginLeft: 16, alignItems: "flex-end" }}>
                    <Text
                      style={{
                        fontFamily: "Poppins_600SemiBold",
                        fontSize: 16,
                        color: colors.primary,
                      }}
                    >
                      {formatNaira(item.amount)}
                    </Text>
                    <Text
                      style={{
                        fontFamily: "Roboto_400Regular",
                        fontSize: 12,
                        color: colors.secondary,
                      }}
                    >
                      {percentage.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
