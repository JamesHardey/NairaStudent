import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  useColorScheme,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ArrowLeft, ChevronDown } from "lucide-react-native";
import { useRouter, useLocalSearchParams } from "expo-router";
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { updateExpense, getDailyLimit, getExpenses } from "../utils/storage";
import { CATEGORIES } from "../constants/categories";
import { formatNaira, calculateRemainingBalance } from "../utils/calculations";
import CustomKeypad from "../components/CustomKeypad";

export default function EditExpense() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [amount, setAmount] = useState("0");
  const [note, setNote] = useState("");
  const [selectedCategory, setSelectedCategory] = useState(CATEGORIES[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [remainingBalance, setRemainingBalance] = useState(0);

  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  useEffect(() => {
    loadExpenseData();
    loadBalance();
  }, []);

  const loadExpenseData = async () => {
    if (params.id) {
      const expenses = await getExpenses();
      const expense = expenses.find((exp) => exp.id === params.id);
      if (expense) {
        setAmount(expense.amount.toString());
        setNote(expense.note || "");
        const category = CATEGORIES.find((cat) => cat.id === expense.category);
        if (category) setSelectedCategory(category);
      }
    }
  };

  const loadBalance = async () => {
    const limit = await getDailyLimit();
    const expenses = await getExpenses();
    const balance = calculateRemainingBalance(limit, expenses);
    setRemainingBalance(balance);
  };

  if (!fontsLoaded) {
    return null;
  }

  const handleKeyPress = async (key) => {
    if (key === "delete") {
      if (amount.length > 1) {
        setAmount(amount.slice(0, -1));
      } else {
        setAmount("0");
      }
    } else if (key === "confirm") {
      if (parseFloat(amount) === 0) {
        Alert.alert("Error", "Please enter an amount");
        return;
      }

      const success = await updateExpense(params.id, {
        amount: parseFloat(amount),
        category: selectedCategory.id,
        note: note.trim(),
      });

      if (success) {
        router.back();
      } else {
        Alert.alert("Error", "Failed to update expense");
      }
    } else if (key === "calendar") {
      console.log("Calendar pressed");
    } else if (key === "₦") {
      console.log("Currency pressed");
    } else {
      if (amount === "0") {
        setAmount(key);
      } else {
        setAmount(amount + key);
      }
    }
  };

  const CategoryButton = ({ category }) => {
    const CategoryIcon = category.icon;
    const isSelected = selectedCategory.id === category.id;

    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedCategory(category);
          setShowCategoryPicker(false);
        }}
        style={{
          backgroundColor: isSelected
            ? isDark
              ? category.darkColor
              : category.lightColor
            : isDark
              ? "#1A1A1A"
              : "#F6F6F6",
          borderRadius: 16,
          padding: 16,
          alignItems: "center",
          borderWidth: isSelected ? 2 : 0,
          borderColor: isDark ? "#FFFFFF" : "#000000",
        }}
      >
        <CategoryIcon
          size={32}
          color={isDark ? "#FFFFFF" : "#000000"}
          style={{ marginBottom: 8 }}
        />
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 12,
            color: isDark ? "#FFFFFF" : "#000000",
            textAlign: "center",
          }}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top + 20,
          paddingHorizontal: 24,
          paddingBottom: 20,
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 18,
            color: colors.primary,
          }}
        >
          Edit Expense
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 24 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Amount Display */}
        <View style={{ marginBottom: 32, alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 16,
              color: colors.secondary,
              marginBottom: 8,
            }}
          >
            Amount
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_600SemiBold",
              fontSize: 56,
              color: colors.primary,
              letterSpacing: -2,
            }}
          >
            {formatNaira(amount)}
          </Text>
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 14,
              color: colors.secondary,
              marginTop: 8,
            }}
          >
            Budget Remaining: {formatNaira(remainingBalance)}
          </Text>
        </View>

        {/* Category Selector */}
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            color: colors.primary,
            marginBottom: 12,
          }}
        >
          Category
        </Text>

        <TouchableOpacity
          onPress={() => setShowCategoryPicker(!showCategoryPicker)}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 24,
          }}
        >
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {React.createElement(selectedCategory.icon, {
              size: 24,
              color: colors.primary,
              style: { marginRight: 12 },
            })}
            <Text
              style={{
                fontFamily: "InstrumentSans_500Medium",
                fontSize: 16,
                color: colors.primary,
              }}
            >
              {selectedCategory.name}
            </Text>
          </View>
          <ChevronDown
            size={20}
            color={colors.secondary}
            style={{
              transform: [
                { rotate: showCategoryPicker ? "180deg" : "0deg" },
              ],
            }}
          />
        </TouchableOpacity>

        {/* Category Picker */}
        {showCategoryPicker && (
          <View
            style={{
              flexDirection: "row",
              flexWrap: "wrap",
              gap: 12,
              marginBottom: 24,
            }}
          >
            {CATEGORIES.map((category) => (
              <View key={category.id} style={{ width: "48%" }}>
                <CategoryButton category={category} />
              </View>
            ))}
          </View>
        )}

        {/* Note Input */}
        <Text
          style={{
            fontFamily: "InstrumentSans_600SemiBold",
            fontSize: 16,
            color: colors.primary,
            marginBottom: 12,
          }}
        >
          Note (Optional)
        </Text>
        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder="What did you buy?"
          placeholderTextColor={colors.secondary}
          style={{
            backgroundColor: colors.card,
            borderRadius: 16,
            padding: 16,
            fontFamily: "InstrumentSans_400Regular",
            fontSize: 16,
            color: colors.primary,
            marginBottom: 32,
          }}
          multiline
          numberOfLines={3}
        />

        {/* Custom Keypad */}
        <CustomKeypad onKeyPress={handleKeyPress} isDark={isDark} />
      </ScrollView>
    </View>
  );
}
