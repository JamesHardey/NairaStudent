import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useColorScheme,
  Alert,
  RefreshControl,
  Switch,
  Linking,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Settings as SettingsIcon,
  Trash2,
  DollarSign,
  Save,
  Brain,
  ExternalLink,
} from "lucide-react-native";
import { useFocusEffect } from "expo-router";
import { useFonts, Poppins_600SemiBold } from "@expo-google-fonts/poppins";
import { Roboto_400Regular } from "@expo-google-fonts/roboto";
import {
  getDailyLimit,
  saveDailyLimit,
  clearAllExpenses,
  getExpenses,
  getAISettings,
  saveAISettings,
} from "../../utils/storage";
import { formatNaira } from "../../utils/calculations";
import { triggerSuccess, triggerError, triggerMedium } from "../../utils/haptics";

export default function Settings() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const [dailyLimit, setDailyLimit] = useState("5000");
  const [tempLimit, setTempLimit] = useState("5000");
  const [expenseCount, setExpenseCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  
  // AI Settings State
  const [aiEnabled, setAiEnabled] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [tempApiKey, setTempApiKey] = useState("");
  const [isEditingKey, setIsEditingKey] = useState(false);

  const [fontsLoaded] = useFonts({
    Poppins_600SemiBold,
    Roboto_400Regular,
  });

  const loadData = async () => {
    const limit = await getDailyLimit();
    const expenses = await getExpenses();
    const aiSettings = await getAISettings();
    
    setDailyLimit(limit.toString());
    setTempLimit(limit.toString());
    setExpenseCount(expenses.length);
    setAiEnabled(aiSettings.enabled);
    setApiKey(aiSettings.apiKey || "");
    setTempApiKey(aiSettings.apiKey || "");
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

  const handleSaveLimit = async () => {
    const newLimit = parseFloat(tempLimit);
    if (isNaN(newLimit) || newLimit <= 0) {
      triggerError();
      Alert.alert("Invalid Amount", "Please enter a valid budget amount");
      return;
    }

    const saved = await saveDailyLimit(newLimit);
    if (saved) {
      triggerSuccess();
      setDailyLimit(newLimit.toString());
      setIsEditing(false);
      Alert.alert("Success", `Daily budget set to ${formatNaira(newLimit)}`);
    } else {
      triggerError();
      Alert.alert("Error", "Failed to save budget");
    }
  };

  const handleClearExpenses = () => {
    triggerMedium();
    Alert.alert(
      "Clear All Expenses",
      "Are you sure you want to delete all expenses? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            const cleared = await clearAllExpenses();
            if (cleared) {
              triggerSuccess();
              Alert.alert("Success", "All expenses have been cleared");
              await loadData();
            } else {
              triggerError();
              Alert.alert("Error", "Failed to clear expenses");
            }
          },
        },
      ],
    );
  };

  const handleToggleAI = async (value) => {
    // If enabling, check if key is present or tell them to add one
    if (value && !apiKey) {
      Alert.alert("API Key Required", "Please enter your Gemini API Key first to enable AI features.");
      setIsEditingKey(true);
      return;
    }
    
    setAiEnabled(value);
    const success = await saveAISettings({ enabled: value, apiKey });
    if (success) {
        triggerMedium();
    } else {
        setAiEnabled(!value); // Revert on failure
        Alert.alert("Error", "Failed to save setting");
    }
  };

  const handleSaveApiKey = async () => {
    if (!tempApiKey.trim()) {
        Alert.alert("Error", "API Key cannot be empty");
        return;
    }
    
    const success = await saveAISettings({ enabled: true, apiKey: tempApiKey.trim() });
    if (success) {
        triggerSuccess();
        setApiKey(tempApiKey.trim());
        setAiEnabled(true);
        setIsEditingKey(false);
        Alert.alert("Success", "AI features enabled! You can now use Smart Entry.");
    } else {
        triggerError();
        Alert.alert("Error", "Failed to save API Key");
    }
  };

  const colors = {
    primary: isDark ? "#FFFFFF" : "#000000",
    secondary: isDark ? "#CCCCCC" : "#8F8F8F",
    background: isDark ? "#121212" : "#FFFFFF",
    card: isDark ? "#2C2C2C" : "#F6F6F6",
    accent: isDark ? "#4A90E2" : "#2563EB",
    danger: isDark ? "#FF6B6B" : "#DC2626",
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />

      {/* Background Circle */}
      <View
        style={{
          position: "absolute",
          top: -80,
          left: -80,
          width: 160,
          height: 160,
          borderRadius: 80,
          backgroundColor: isDark ? "#1A4D2E" : "#CBFACF",
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
            Settings
          </Text>
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 16,
              color: colors.secondary,
            }}
          >
            Manage your budget and data
          </Text>
        </View>

        {/* Daily Budget Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: isDark ? "#1A4D2E" : "#CBFACF",
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <DollarSign size={24} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.primary,
                  marginBottom: 4,
                }}
              >
                Daily Budget Limit
              </Text>
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 14,
                  color: colors.secondary,
                }}
              >
                Set your spending limit
              </Text>
            </View>
          </View>

          {isEditing ? (
            <View>
              <TextInput
                value={tempLimit}
                onChangeText={setTempLimit}
                placeholder="Enter amount"
                placeholderTextColor={colors.secondary}
                keyboardType="numeric"
                style={{
                  backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                  borderRadius: 16,
                  padding: 16,
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 24,
                  color: colors.primary,
                  marginBottom: 16,
                  borderWidth: 2,
                  borderColor: colors.accent,
                }}
                autoFocus
              />
              <View style={{ flexDirection: "row", gap: 12 }}>
                <TouchableOpacity
                  onPress={() => {
                    triggerMedium();
                    setTempLimit(dailyLimit);
                    setIsEditing(false);
                  }}
                  style={{
                    flex: 1,
                    backgroundColor: isDark ? "#1A1A1A" : "#E5E7EB",
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                  }}
                >
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 16,
                      color: colors.primary,
                    }}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSaveLimit}
                  style={{
                    flex: 1,
                    backgroundColor: colors.accent,
                    borderRadius: 12,
                    padding: 16,
                    alignItems: "center",
                    flexDirection: "row",
                    justifyContent: "center",
                    gap: 8,
                  }}
                >
                  <Save size={20} color="#FFFFFF" />
                  <Text
                    style={{
                      fontFamily: "Poppins_600SemiBold",
                      fontSize: 16,
                      color: "#FFFFFF",
                    }}
                  >
                    Save
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity
              onPress={() => {
                triggerMedium();
                setIsEditing(true);
              }}
              activeOpacity={0.7}
              style={{
                backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                borderRadius: 16,
                padding: 20,
                alignItems: "center",
                borderWidth: 2,
                borderColor: "transparent",
              }}
            >
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 36,
                  color: colors.accent,
                  letterSpacing: -1,
                }}
              >
                {formatNaira(dailyLimit)}
              </Text>
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 14,
                  color: colors.secondary,
                  marginTop: 8,
                }}
              >
                Tap to edit
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* AI Features Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 1,
            borderColor: aiEnabled ? colors.accent : "transparent",
          }}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 20,
            }}
          >
            <View
              style={{
                width: 48,
                height: 48,
                backgroundColor: isDark ? "#2A1A40" : "#F0E6FF",
                borderRadius: 24,
                alignItems: "center",
                justifyContent: "center",
                marginRight: 16,
              }}
            >
              <Brain size={24} color={isDark ? "#A78BFA" : "#7C3AED"} />
            </View>
            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontFamily: "Poppins_600SemiBold",
                  fontSize: 18,
                  color: colors.primary,
                  marginBottom: 4,
                }}
              >
                AI Features
              </Text>
              <Text
                style={{
                  fontFamily: "Roboto_400Regular",
                  fontSize: 14,
                  color: colors.secondary,
                }}
              >
                Smart Entry & Receipt Scan
              </Text>
            </View>
            <Switch 
                value={aiEnabled}
                onValueChange={handleToggleAI}
                trackColor={{ false: isDark ? "#444" : "#ddd", true: colors.accent }}
                thumbColor={"#fff"}
            />
          </View>

          {/* API Key Section */}
          {(aiEnabled || isEditingKey) && (
            <View>
                <Text style={{
                    fontFamily: "Roboto_400Regular",
                    fontSize: 12,
                    color: colors.secondary,
                    marginBottom: 8
                }}>
                    Google Gemini API Key
                </Text>
                
                <View style={{ flexDirection: "row", gap: 8, marginBottom: 12 }}>
                    <TextInput 
                        style={{
                            flex: 1,
                            backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF",
                            borderRadius: 12,
                            padding: 12,
                            fontFamily: "Roboto_400Regular",
                            color: colors.primary,
                            borderWidth: 1,
                            borderColor: isDark ? "#444" : "#ddd"
                        }}
                        placeholder="Paste API Key here..."
                        placeholderTextColor={colors.secondary}
                        value={tempApiKey}
                        onChangeText={setTempApiKey}
                        secureTextEntry
                    />
                    {tempApiKey !== apiKey && (
                        <TouchableOpacity
                            onPress={handleSaveApiKey}
                            style={{
                                backgroundColor: colors.accent,
                                borderRadius: 12,
                                padding: 12,
                                justifyContent: "center",
                                alignItems: "center"
                            }}
                        >
                            <Save size={20} color="#fff" />
                        </TouchableOpacity>
                    )}
                </View>
                
                <TouchableOpacity 
                    onPress={() => Linking.openURL("https://aistudio.google.com/app/apikey")}
                    style={{ flexDirection: "row", alignItems: "center" }}
                >
                    <Text style={{ color: colors.accent, fontFamily: "Poppins_600SemiBold", fontSize: 12, marginRight: 4 }}>
                        Get a free API Key
                    </Text>
                    <ExternalLink size={12} color={colors.accent} />
                </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Stats Card */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
              color: colors.primary,
              marginBottom: 16,
            }}
          >
            Statistics
          </Text>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              paddingVertical: 12,
            }}
          >
            <Text
              style={{
                fontFamily: "Roboto_400Regular",
                fontSize: 16,
                color: colors.secondary,
              }}
            >
              Total Expenses
            </Text>
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: colors.primary,
              }}
            >
              {expenseCount}
            </Text>
          </View>
        </View>

        {/* Danger Zone */}
        <View
          style={{
            backgroundColor: colors.card,
            borderRadius: 24,
            padding: 24,
            marginBottom: 24,
            borderWidth: 2,
            borderColor: colors.danger,
          }}
        >
          <Text
            style={{
              fontFamily: "Poppins_600SemiBold",
              fontSize: 18,
              color: colors.danger,
              marginBottom: 16,
            }}
          >
            Danger Zone
          </Text>
          <TouchableOpacity
            onPress={handleClearExpenses}
            style={{
              backgroundColor: colors.danger,
              borderRadius: 16,
              padding: 16,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            }}
          >
            <Trash2 size={20} color="#FFFFFF" />
            <Text
              style={{
                fontFamily: "Poppins_600SemiBold",
                fontSize: 16,
                color: "#FFFFFF",
              }}
            >
              Clear All Expenses
            </Text>
          </TouchableOpacity>
        </View>

        {/* App Info */}
        <View style={{ alignItems: "center", paddingVertical: 24 }}>
          <Text
            style={{
              fontFamily: "Roboto_400Regular",
              fontSize: 14,
              color: colors.secondary,
              textAlign: "center",
            }}
          >
            NairaStudent v1.0{"\n"}
            Expense Tracker for Nigerian Students
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}
