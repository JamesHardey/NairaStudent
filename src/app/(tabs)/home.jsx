import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Plus, TrendingDown, Wallet } from "lucide-react-native";
import { useRouter, useFocusEffect } from "expo-router";
import {
  useFonts,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { getDailyLimit, getExpenses } from "../../utils/storage";
import {
  formatNaira,
  calculateDailyTotal,
  calculateRemainingBalance,
  calculateProgressPercentage,
  getStatusColor,
  isToday,
} from "../../utils/calculations";
import { getCategoryById, getCategoryColor } from "../../constants/categories";

export default function Home() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [dailyLimit, setDailyLimit] = useState(5000);
  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Poppins_500Medium,
    Roboto_400Regular,
  });

  const loadData = async () => {
    const limit = await getDailyLimit();
    const expenseData = await getExpenses();
    setDailyLimit(limit);
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

  const dailyTotal = calculateDailyTotal(expenses);
  const remainingBalance = calculateRemainingBalance(dailyLimit, expenses);
  const progressPercentage = calculateProgressPercentage(dailyLimit, expenses);
  const statusColors = getStatusColor(dailyLimit, expenses, isDark);
  const todayExpenses = expenses.filter((exp) => isToday(exp.date));

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
  };

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
          backgroundColor: isDark ? "#1A4D2E" : "#CBFACF",
          opacity: isDark ? 0.4 : 0.3,
        }}
      />
      <View
        style={{
          position: "absolute",
          bottom: -100,
          left: -100,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: isDark ? "#4A2C2A" : "#FFDCD5",
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
            NairaStudent
          </Text>
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 16,
              color: colors.secondary,
            }}
          >
            Track your daily spending
          </Text>
        </View>

        {/* Budget Status Card */}
        <View
          style={{
            backgroundColor: statusColors.background,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: statusColors.border,
          }}
        >
          <View style={{ alignItems: "center", marginBottom: 20 }}>
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 14,
                color: colors.secondary,
                marginBottom: 8,
              }}
            >
              Remaining Today
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 48,
                color: statusColors.text,
                letterSpacing: -2,
              }}
            >
              {formatNaira(remainingBalance)}
            </Text>
          </View>

          {/* Progress Bar */}
          <View
            style={{
              height: 8,
              backgroundColor: isDark ? "#1A1A1A" : "#E5E7EB",
              borderRadius: 4,
              marginBottom: 16,
              overflow: "hidden",
            }}
          >
            <View
              style={{
                height: "100%",
                width: `${progressPercentage}%`,
                backgroundColor: statusColors.text,
                borderRadius: 4,
              }}
            />
          </View>

          {/* Daily Limit & Spent */}
          <View
            style={{ flexDirection: "row", justifyContent: "space-between" }}
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
                Daily Limit
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.primary,
                }}
              >
                {formatNaira(dailyLimit)}
              </Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 12,
                  color: colors.secondary,
                  marginBottom: 4,
                }}
              >
                Spent Today
              </Text>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: statusColors.text,
                }}
              >
                {formatNaira(dailyTotal)}
              </Text>
            </View>
          </View>
        </View>

        {/* Quick Stats */}
        <View style={{ flexDirection: "row", gap: 12, marginBottom: 24 }}>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <Wallet
              size={24}
              color={colors.secondary}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 20,
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {todayExpenses.length}
            </Text>
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
              }}
            >
              Transactions
            </Text>
          </View>
          <View
            style={{
              flex: 1,
              backgroundColor: colors.card,
              borderRadius: 16,
              padding: 16,
            }}
          >
            <TrendingDown
              size={24}
              color={colors.secondary}
              style={{ marginBottom: 8 }}
            />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 20,
                color: colors.primary,
                marginBottom: 4,
              }}
            >
              {progressPercentage.toFixed(0)}%
            </Text>
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
              }}
            >
              Budget Used
            </Text>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 20,
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            Today's Expenses
          </Text>

          {todayExpenses.length === 0 ? (
            <View
              style={{
                backgroundColor: colors.card,
                borderRadius: 16,
                padding: 32,
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 14,
                  color: colors.secondary,
                  textAlign: "center",
                }}
              >
                No expenses yet today.{"\n"}Tap + to add your first expense.
              </Text>
            </View>
          ) : (
            todayExpenses.slice(0, 5).map((expense) => {
              const category = getCategoryById(expense.category);
              const CategoryIcon = category.icon;

              return (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => router.push(`/edit-expense?id=${expense.id}`)}
                  activeOpacity={0.7}
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
                      backgroundColor: getCategoryColor(
                        expense.category,
                        isDark,
                      ),
                      borderRadius: 24,
                      alignItems: "center",
                      justifyContent: "center",
                      marginRight: 12,
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
                        marginBottom: 2,
                      }}
                    >
                      {category.name}
                    </Text>
                    {expense.note && (
                      <Text
                        style={{
                          fontFamily: "Roboto_400Regular",
                          fontSize: 12,
                          color: colors.secondary,
                        }}
                      >
                        {expense.note}
                      </Text>
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 18,
                      color: colors.primary,
                    }}
                  >
                    {formatNaira(expense.amount)}
                  </Text>
                </TouchableOpacity>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={{
          position: "absolute",
          bottom: insets.bottom + 80,
          right: 24,
          width: 64,
          height: 64,
          backgroundColor: isDark ? "#FFFFFF" : "#000",
          borderRadius: 32,
          alignItems: "center",
          justifyContent: "center",
          elevation: 8,
          shadowColor: isDark ? "#FFFFFF" : "#000",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={() => router.push("/add-expense")}
        activeOpacity={0.8}
      >
        <Plus size={28} color={isDark ? "#000" : "#fff"} />
      </TouchableOpacity>
    </View>
  );
}
