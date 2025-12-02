import React, { useState } from "react";
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
import { useRouter } from "expo-router";
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { saveExpense, getDailyLimit, getExpenses } from "../utils/storage";
import { CATEGORIES } from "../constants/categories";
import { formatNaira, calculateRemainingBalance, calculateDailyTotal } from "../utils/calculations";
import CustomKeypad from "../components/CustomKeypad";
import { triggerLight, triggerSuccess, triggerError, triggerSelection } from "../utils/haptics";
import { checkBudgetThreshold } from "../utils/notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function AddExpense() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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

  React.useEffect(() => {
    loadBalance();
  }, []);

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
    triggerLight();
    
    if (key === "delete") {
      if (amount.length > 1) {
        setAmount(amount.slice(0, -1));
      } else {
        setAmount("0");
      }
    } else if (key === "confirm") {
      // Save expense
      if (parseFloat(amount) === 0) {
        triggerError();
        Alert.alert("Error", "Please enter an amount");
        return;
      }

      const expense = {
        amount: parseFloat(amount),
        category: selectedCategory.id,
        note: note.trim(),
        date: new Date().toISOString(),
      };

      const saved = await saveExpense(expense);
      if (saved) {
        triggerSuccess();
        
        // Check budget and send notifications
        const limit = await getDailyLimit();
        const expenses = await getExpenses();
        const dailyTotal = calculateDailyTotal(expenses);
        const lastAlertLevel = parseInt(await AsyncStorage.getItem("@last_alert_level") || "0");
        const newAlertLevel = await checkBudgetThreshold(limit, dailyTotal, lastAlertLevel);
        await AsyncStorage.setItem("@last_alert_level", newAlertLevel.toString());
        
        router.back();
      } else {
        triggerError();
        Alert.alert("Error", "Failed to save expense");
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
        style={{
          height: 48,
          backgroundColor: isSelected
            ? isDark
              ? category.darkColor
              : category.lightColor
            : isDark
              ? "#2C2C2C"
              : "#F6F6F6",
          borderRadius: 24,
          flexDirection: "row",
          alignItems: "center",
          paddingHorizontal: 16,
          marginBottom: 12,
          borderWidth: isSelected ? 2 : 0,
          borderColor: isSelected
            ? isDark
              ? "#FFFFFF"
              : "#000"
            : "transparent",
        }}
        onPress={() => {
          triggerSelection();
          setSelectedCategory(category);
          setShowCategoryPicker(false);
        }}
        activeOpacity={0.8}
      >
        <CategoryIcon size={20} color={isDark ? "#FFFFFF" : "#000"} />
        <Text
          style={{
            fontFamily: "InstrumentSans_500Medium",
            fontSize: 14,
            color: isDark ? "#FFFFFF" : "#000",
            marginLeft: 8,
            flex: 1,
          }}
        >
          {category.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const darkTopBarColor = isDark ? "#2C2C2C" : "#353535";
  const lightBottomColor = isDark ? "#121212" : "#fff";
  const SelectedIcon = selectedCategory.icon;

  return (
    <View style={{ flex: 1, backgroundColor: darkTopBarColor }}>
      <StatusBar style="light" />

      {/* Fixed Header */}
      <View
        style={{
          backgroundColor: darkTopBarColor,
          paddingTop: insets.top + 12,
          paddingHorizontal: 24,
          paddingBottom: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={{ padding: 4 }}
            activeOpacity={0.7}
          >
            <ArrowLeft size={24} color="rgba(255,255,255,0.9)" />
          </TouchableOpacity>

          <View style={{ alignItems: "center" }}>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 18,
                color: "#fff",
              }}
            >
              {formatNaira(remainingBalance)}
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_400Regular",
                fontSize: 12,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              Remaining Today
            </Text>
          </View>

          <View style={{ width: 24 }} />
        </View>
      </View>

      {/* Bottom Sheet */}
      <ScrollView
        style={{
          flex: 1,
          marginTop: 12,
          backgroundColor: lightBottomColor,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
        }}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={{ paddingTop: 12, paddingHorizontal: 24 }}>
          {/* Handle */}
          <View
            style={{
              width: 36,
              height: 4,
              backgroundColor: isDark ? "#444444" : "#BEBEBE",
              borderRadius: 2,
              alignSelf: "center",
              marginBottom: 24,
            }}
          />

          {/* Category Selector */}
          <TouchableOpacity
            style={{
              height: 48,
              backgroundColor: isDark
                ? selectedCategory.darkColor
                : selectedCategory.lightColor,
              borderRadius: 24,
              flexDirection: "row",
              alignItems: "center",
              paddingHorizontal: 16,
              justifyContent: "space-between",
              marginBottom: 24,
            }}
            onPress={() => setShowCategoryPicker(!showCategoryPicker)}
            activeOpacity={0.8}
          >
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <SelectedIcon size={22} color={isDark ? "#FFFFFF" : "#000"} />
              <Text
                style={{
                  fontFamily: "InstrumentSans_500Medium",
                  fontSize: 16,
                  color: isDark ? "#FFFFFF" : "#000",
                  marginLeft: 8,
                }}
              >
                {selectedCategory.name}
              </Text>
            </View>
            <ChevronDown size={16} color={isDark ? "#FFFFFF" : "#000"} />
          </TouchableOpacity>

          {/* Category Picker */}
          {showCategoryPicker && (
            <View style={{ marginBottom: 24 }}>
              {CATEGORIES.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
            </View>
          )}

          {/* Section Label */}
          <Text
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 16,
              color: isDark ? "#CCCCCC" : "#7F7F7F",
              textAlign: "center",
              marginBottom: 24,
            }}
          >
            Expenses
          </Text>

          {/* Amount Input */}
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 36,
                color: isDark ? "#888888" : "#B0B0B0",
              }}
            >
              ₦
            </Text>
            <Text
              style={{
                fontFamily: "InstrumentSans_600SemiBold",
                fontSize: 64,
                color: isDark ? "#FFFFFF" : "#000",
                letterSpacing: -2,
              }}
            >
              {amount}
            </Text>
          </View>

          {/* Note Field */}
          <TextInput
            style={{
              fontFamily: "InstrumentSans_400Regular",
              fontSize: 16,
              color: isDark ? "#FFFFFF" : "#000",
              textAlign: "center",
              marginBottom: 32,
              paddingVertical: 8,
            }}
            placeholder="Add note…"
            placeholderTextColor={isDark ? "#888888" : "#9A9A9A"}
            value={note}
            onChangeText={setNote}
            multiline={false}
          />

          {/* Custom Keypad */}
          <CustomKeypad onKeyPress={handleKeyPress} />
        </View>
      </ScrollView>
    </View>
  );
}
