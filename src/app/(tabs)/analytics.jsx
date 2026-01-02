import React, { useState, useCallback, useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  useColorScheme,
  Dimensions,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PieChart, Calendar, TrendingUp } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import {
  formatNaira,
  calculateCategoryBreakdown,
  calculateDailyTotal,
  isThisWeek,
  isThisMonth,
  isThisYear
} from "../../utils/calculations";
import { DEFAULT_CATEGORIES } from "../../constants/categories";
import { getExpenses, getCategories } from "../../utils/storage";

const { width: screenWidth } = Dimensions.get("window");

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState("week"); // Default to week to show something initially, or month

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Roboto_400Regular,
  });

  const loadData = async () => {
    const expenseData = await getExpenses();
    const cats = await getCategories();
    setExpenses(expenseData);
    setCategories(cats);
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

  const filteredExpenses = useMemo(() => {
    let filtered = [];
    switch (selectedPeriod) {
      case "week":
        filtered = expenses.filter(exp => isThisWeek(exp.date));
        break;
      case "month":
        filtered = expenses.filter(exp => isThisMonth(exp.date));
        break;
      case "year":
        filtered = expenses.filter(exp => isThisYear(exp.date));
        break;
      default:
        filtered = expenses;
    }
    console.log(`Analytics Filter Debug: Period=${selectedPeriod}, TotalExpenses=${expenses.length}, Filtered=${filtered.length}`);
    return filtered;
  }, [expenses, selectedPeriod]);

  const categoryBreakdown = useMemo(() => {
     const breakdown = filteredExpenses.reduce((acc, exp) => {
      const category = exp.category;
      if (!acc[category]) {
        acc[category] = 0;
      }
      acc[category] += parseFloat(exp.amount);
      return acc;
    }, {});

    const total = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

    return Object.entries(breakdown).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? (amount / total) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  const totalSpent = filteredExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);

  if (!fontsLoaded) {
    return null;
  }

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
    accent: isDark ? "#4A90E2" : "#2563EB",
  };

  const PieChartDisplay = () => {
    if (categoryBreakdown.length === 0) {
      return (
        <View
          style={{
            width: "100%",
            height: 200,
            borderRadius: 16,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 24,
          }}
        >
          <PieChart size={48} color={colors.secondary} />
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 14,
              color: colors.secondary,
              marginTop: 16,
            }}
          >
            No data for this {selectedPeriod}
          </Text>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 32, alignItems: 'center' }}>
        <View style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            borderWidth: 20,
            borderColor: colors.card,
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 16
        }}>
            <Text
            style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 24,
                color: colors.primary,
                textAlign: "center",
            }}
            >
            {formatNaira(totalSpent)}
            </Text>
             <Text
            style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 12,
                color: colors.secondary,
                textAlign: "center",
            }}
            >
            Total {selectedPeriod}
            </Text>
        </View>
      </View>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Background Circle */}
      <View
        style={{
          position: "absolute",
          top: -100,
          left: -100,
          width: 200,
          height: 200,
          borderRadius: 100,
          backgroundColor: isDark ? "#1A3A8A" : "#BFD4FF",
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
            Analytics
          </Text>
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 16,
              color: colors.secondary,
            }}
          >
            Spending breakdown
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
          {['week', 'month', 'year'].map((period) => (
             <TouchableOpacity
                key={period}
                onPress={() => setSelectedPeriod(period)}
                style={{
                flex: 1,
                paddingVertical: 12,
                borderRadius: 8,
                backgroundColor:
                    selectedPeriod === period ? colors.accent : "transparent",
                }}
            >
                <Text
                style={{
                    fontFamily: "Poppins_600SemiBold",
                    fontSize: 14,
                    color:
                    selectedPeriod === period ? "#FFFFFF" : colors.secondary,
                    textAlign: "center",
                    textTransform: 'capitalize'
                }}
                >
                {period}
                </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Total Display */}
        <PieChartDisplay />

        {/* Category Breakdown */}
        <View style={{ marginBottom: 24 }}>
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 20,
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            Top Categories
          </Text>

          {categoryBreakdown.length === 0 ? (
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
                No expenses to show for this {selectedPeriod}.
              </Text>
            </View>
          ) : (
            categoryBreakdown.map((item, index) => {
              const category = categories.find(c => c.id === item.category) || DEFAULT_CATEGORIES[4];
              const CategoryIcon = category.icon;
              const categoryColor = isDark ? category.darkColor : category.lightColor;

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
                      backgroundColor: categoryColor,
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
                            width: '100%'
                        }}
                    >
                        <View
                            style={{
                            height: "100%",
                            width: `${item.percentage}%`,
                            backgroundColor: colors.accent,
                            borderRadius: 2,
                            }}
                        />
                    </View>
                  </View>
                  <View style={{ alignItems: 'flex-end', marginLeft: 12 }}>
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
                        {item.percentage.toFixed(1)}%
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
