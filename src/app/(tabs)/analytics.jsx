import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  useColorScheme,
  Dimensions,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PieChart } from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import { getExpenses } from "../../utils/storage";
import {
  formatNaira,
  calculateCategoryBreakdown,
  calculateDailyTotal,
} from "../../utils/calculations";
import { getCategoryById, getCategoryColor } from "../../constants/categories";

const { width: screenWidth } = Dimensions.get("window");

export default function Analytics() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [expenses, setExpenses] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

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

  const categoryBreakdown = calculateCategoryBreakdown(expenses);
  const dailyTotal = calculateDailyTotal(expenses);

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
  };

  // Simple pie chart visualization with list
  const PieChartDisplay = () => {
    if (categoryBreakdown.length === 0) {
      return (
        <View
          style={{
            width: screenWidth - 48,
            height: 200,
            borderRadius: 16,
            backgroundColor: colors.card,
            alignItems: "center",
            justifyContent: "center",
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
            No data yet
          </Text>
        </View>
      );
    }

    return (
      <View style={{ marginBottom: 32 }}>
        <Text
          style={{
            fontFamily: "Poppins_600SemiBold",
            fontSize: 28,
            color: colors.primary,
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          {formatNaira(dailyTotal)}
        </Text>
        <Text
          style={{
            fontFamily: "Roboto_400Regular",
            fontSize: 14,
            color: colors.secondary,
            textAlign: "center",
            marginBottom: 24,
          }}
        >
          Total Spent Today
        </Text>
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
            Today's spending breakdown
          </Text>
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
            Breakdown by Category
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
                No expenses to show yet.{"\n"}Add an expense to see your
                breakdown.
              </Text>
            </View>
          ) : (
            categoryBreakdown.map((item, index) => {
              const category = getCategoryById(item.category);
              const CategoryIcon = category.icon;

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
                      backgroundColor: getCategoryColor(item.category, isDark),
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
                    <Text
                      style={{
                        fontFamily: "Roboto_400Regular",
                        fontSize: 12,
                        color: colors.secondary,
                      }}
                    >
                      {item.percentage.toFixed(1)}% of total
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 18,
                      color: colors.primary,
                    }}
                  >
                    {formatNaira(item.amount)}
                  </Text>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}
