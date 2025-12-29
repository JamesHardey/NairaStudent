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
import { ArrowLeft, ChevronDown, Plus, CircleDollarSign, Sparkles, X } from "lucide-react-native";
import { useRouter } from "expo-router";
import {
  useFonts,
  InstrumentSans_400Regular,
  InstrumentSans_500Medium,
  InstrumentSans_600SemiBold,
} from "@expo-google-fonts/instrument-sans";
import { saveExpense, getDailyLimit, getExpenses, getCategories, saveCategory, getAISettings } from "../utils/storage";
import { processExpenseText } from "../utils/ai";
import { DEFAULT_CATEGORIES } from "../constants/categories";
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
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [selectedCategory, setSelectedCategory] = useState(DEFAULT_CATEGORIES[0]);
  const [showCategoryPicker, setShowCategoryPicker] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(0);

  // AI State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [showSmartEntry, setShowSmartEntry] = useState(false);
  const [smartText, setSmartText] = useState("");
  const [isProcessingAI, setIsProcessingAI] = useState(false);

  const [fontsLoaded] = useFonts({
    InstrumentSans_400Regular,
    InstrumentSans_500Medium,
    InstrumentSans_600SemiBold,
  });

  React.useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await loadBalance();
    const loadedCats = await getCategories();
    const aiSettings = await getAISettings();
    setAiEnabled(aiSettings.enabled && !!aiSettings.apiKey);
    
    if (loadedCats && loadedCats.length > 0) {
      setCategories(loadedCats);
      // Ensure selected category is valid or revert to first
      setSelectedCategory(prev => loadedCats.find(c => c.id === prev.id) || loadedCats[0]);
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

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) {
      triggerError();
      Alert.alert("Error", "Please enter a category name");
      return;
    }

    const newCat = {
      id: `custom_${Date.now()}`,
      name: newCategoryName.trim(),
      iconName: "CircleDollarSign",
      lightColor: "#E0E0E0",
      darkColor: "#333333",
    };

    const success = await saveCategory(newCat);
    if (success) {
      triggerSuccess();
      const newCatWithIcon = { ...newCat, icon: CircleDollarSign };
      const updatedCats = [...categories, newCatWithIcon];
      setCategories(updatedCats);
      setSelectedCategory(newCatWithIcon);
      setNewCategoryName("");
      setIsCreatingCategory(false);
      setShowCategoryPicker(false);
    } else {
      triggerError();
      Alert.alert("Error", "Failed to create category");
    }
  };

  const handleSmartEntry = async () => {
    if (!smartText.trim()) return;
    
    setIsProcessingAI(true);
    triggerSelection();
    
    // Call AI Service
    const result = await processExpenseText(smartText);
    
    setIsProcessingAI(false);
    
    if (result) {
        triggerSuccess();
        setAmount(result.amount.toString());
        setNote(result.note || smartText);
        
        // Find category by ID returned from AI (which matched by name)
        const matchedCat = categories.find(c => c.id === result.categoryId);
        if (matchedCat) {
            setSelectedCategory(matchedCat);
        }
        
        setShowSmartEntry(false);
        setSmartText("");
    } else {
        triggerError();
        Alert.alert("AI Error", "Could not understand the expense. Try being more specific.");
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

          {/* AI Smart Entry Button */}
          {aiEnabled && !showSmartEntry && (
            <TouchableOpacity
                onPress={() => {
                    triggerSelection();
                    setShowSmartEntry(true);
                }}
                style={{
                    alignSelf: "center",
                    backgroundColor: colors.primary, // Using colors object if available, else literal
                    backgroundColor: isDark ? "#2A1A40" : "#F0E6FF",
                    paddingVertical: 8,
                    paddingHorizontal: 16,
                    borderRadius: 20,
                    marginBottom: 20,
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 8,
                    borderWidth: 1,
                    borderColor: isDark ? "#A78BFA" : "#7C3AED"
                }}
            >
                <Sparkles size={16} color={isDark ? "#A78BFA" : "#7C3AED"} />
                <Text style={{ 
                    fontFamily: "InstrumentSans_600SemiBold", 
                    color: isDark ? "#A78BFA" : "#7C3AED",
                    fontSize: 14
                }}>
                    Smart Entry
                </Text>
            </TouchableOpacity>
          )}

          {/* Smart Entry Input Area */}
          {showSmartEntry && (
            <View style={{
                marginBottom: 24,
                backgroundColor: isDark ? "#2A1A40" : "#F5F3FF",
                borderRadius: 20,
                padding: 16,
                borderWidth: 1,
                borderColor: isDark ? "#A78BFA" : "#7C3AED"
            }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                    <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: isDark ? "#fff" : "#000" }}>
                        Describe your expense
                    </Text>
                    <TouchableOpacity onPress={() => setShowSmartEntry(false)}>
                        <X size={20} color={isDark ? "#aaa" : "#666"} />
                    </TouchableOpacity>
                </View>
                
                <TextInput
                    style={{
                        fontFamily: "InstrumentSans_400Regular",
                        fontSize: 16,
                        color: isDark ? "#fff" : "#000",
                        marginBottom: 16,
                        minHeight: 60
                    }}
                    placeholder="e.g. 'Rice and chicken 1500 at Mama Put'"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    multiline
                    value={smartText}
                    onChangeText={setSmartText}
                    autoFocus
                />
                
                <TouchableOpacity
                    onPress={handleSmartEntry}
                    disabled={isProcessingAI}
                    style={{
                        backgroundColor: isDark ? "#A78BFA" : "#7C3AED",
                        borderRadius: 12,
                        paddingVertical: 12,
                        alignItems: "center",
                        opacity: isProcessingAI ? 0.7 : 1
                    }}
                >
                    <Text style={{ fontFamily: "InstrumentSans_600SemiBold", color: "#fff" }}>
                        {isProcessingAI ? "Analyzing..." : "Auto-Fill details"}
                    </Text>
                </TouchableOpacity>
            </View>
          )}

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
              {categories.map((category) => (
                <CategoryButton key={category.id} category={category} />
              ))}
              
              {isCreatingCategory ? (
                <View
                  style={{
                    backgroundColor: isDark ? "#2C2C2C" : "#F6F6F6",
                    borderRadius: 24,
                    padding: 12,
                    marginTop: 8,
                  }}
                >
                  <TextInput
                    style={{
                      fontFamily: "InstrumentSans_400Regular",
                      fontSize: 16,
                      color: isDark ? "#FFFFFF" : "#000",
                      marginBottom: 12,
                      padding: 8,
                      borderBottomWidth: 1,
                      borderBottomColor: isDark ? "#444" : "#ddd",
                    }}
                    placeholder="Category Name"
                    placeholderTextColor={isDark ? "#888" : "#999"}
                    value={newCategoryName}
                    onChangeText={setNewCategoryName}
                    autoFocus
                  />
                  <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
                    <TouchableOpacity
                      onPress={() => setIsCreatingCategory(false)}
                      style={{ padding: 8 }}
                    >
                      <Text style={{ color: isDark ? "#888" : "#666", fontFamily: "InstrumentSans_500Medium" }}>Cancel</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={handleCreateCategory}
                      style={{ 
                        padding: 8, 
                        backgroundColor: isDark ? "#FFF" : "#000",
                        borderRadius: 16,
                        paddingHorizontal: 16
                      }}
                    >
                      <Text style={{ color: isDark ? "#000" : "#FFF", fontFamily: "InstrumentSans_500Medium" }}>Save</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <TouchableOpacity
                  style={{
                    height: 48,
                    backgroundColor: isDark ? "#2C2C2C" : "#FFFFFF",
                    borderRadius: 24,
                    flexDirection: "row",
                    alignItems: "center",
                    paddingHorizontal: 16,
                    marginBottom: 12,
                    borderWidth: 1,
                    borderColor: isDark ? "#444" : "#E0E0E0",
                    borderStyle: "dashed",
                  }}
                  onPress={() => {
                    triggerSelection();
                    setIsCreatingCategory(true);
                  }}
                >
                  <Plus size={20} color={isDark ? "#888888" : "#666666"} />
                  <Text
                    style={{
                      fontFamily: "InstrumentSans_500Medium",
                      fontSize: 14,
                      color: isDark ? "#888888" : "#666666",
                      marginLeft: 8,
                    }}
                  >
                    Add new category
                  </Text>
                </TouchableOpacity>
              )}
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
