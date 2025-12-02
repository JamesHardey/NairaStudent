import React from "react";
import {
  View,
  TouchableOpacity,
  Text,
  Dimensions,
  useColorScheme,
} from "react-native";
import { Delete, Calendar } from "lucide-react-native";

const { width: screenWidth } = Dimensions.get("window");
const PADDING_HORIZONTAL = 24;
const RIGHT_PADDING = 16;
const GAP = 8;
const TOTAL_WIDTH = screenWidth - PADDING_HORIZONTAL * 2 - RIGHT_PADDING;
const GRID_WIDTH = TOTAL_WIDTH * 0.75 - GAP / 2;
const SIDE_WIDTH = TOTAL_WIDTH * 0.25 - GAP / 2;
const BUTTON_WIDTH = (GRID_WIDTH - GAP * 2) / 3;

export default function CustomKeypad({ onKeyPress }) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const KeypadButton = ({ children, onPress, style, textStyle }) => (
    <TouchableOpacity
      style={[
        {
          width: BUTTON_WIDTH,
          aspectRatio: 1,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#2C2C2C" : "#F6F6F6",
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {typeof children === "string" ? (
        <Text
          style={[
            {
              fontFamily: "InstrumentSans_500Medium",
              fontSize: 24,
              color: isDark ? "#FFFFFF" : "#000",
              lineHeight: 28,
            },
            textStyle,
          ]}
        >
          {children}
        </Text>
      ) : (
        children
      )}
    </TouchableOpacity>
  );

  const SideButton = ({ children, onPress, style }) => (
    <TouchableOpacity
      style={[
        {
          width: SIDE_WIDTH,
          aspectRatio: 1,
          borderRadius: 16,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: isDark ? "#2C2C2C" : "#F6F6F6",
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      {children}
    </TouchableOpacity>
  );

  const ConfirmButton = ({ onPress }) => (
    <TouchableOpacity
      style={{
        width: SIDE_WIDTH,
        height: BUTTON_WIDTH * 2 + GAP,
        backgroundColor: isDark ? "#FFFFFF" : "#000",
        borderRadius: 16,
        alignItems: "center",
        justifyContent: "center",
      }}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <Text
        style={{
          color: isDark ? "#000" : "#fff",
          fontSize: 20,
          fontWeight: "bold",
        }}
      >
        ✓
      </Text>
    </TouchableOpacity>
  );

  return (
    <View
      style={{
        paddingLeft: PADDING_HORIZONTAL,
        paddingRight: PADDING_HORIZONTAL + RIGHT_PADDING,
        backgroundColor: isDark ? "#121212" : "#FFFFFF",
      }}
    >
      <View style={{ flexDirection: "row", gap: GAP }}>
        {/* Main keypad grid */}
        <View style={{ gap: GAP }}>
          <View style={{ flexDirection: "row", gap: GAP }}>
            <KeypadButton onPress={() => onKeyPress("1")}>1</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("2")}>2</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("3")}>3</KeypadButton>
          </View>

          <View style={{ flexDirection: "row", gap: GAP }}>
            <KeypadButton onPress={() => onKeyPress("4")}>4</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("5")}>5</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("6")}>6</KeypadButton>
          </View>

          <View style={{ flexDirection: "row", gap: GAP }}>
            <KeypadButton onPress={() => onKeyPress("7")}>7</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("8")}>8</KeypadButton>
            <KeypadButton onPress={() => onKeyPress("9")}>9</KeypadButton>
          </View>

          <View style={{ flexDirection: "row", gap: GAP }}>
            <KeypadButton
              onPress={() => onKeyPress("₦")}
              style={{ backgroundColor: isDark ? "#1A4D2E" : "#CBFACF" }}
            >
              ₦
            </KeypadButton>
            <KeypadButton onPress={() => onKeyPress("0")}>0</KeypadButton>
            <KeypadButton onPress={() => onKeyPress(".")}>.</KeypadButton>
          </View>
        </View>

        {/* Side buttons */}
        <View style={{ gap: GAP }}>
          <SideButton
            onPress={() => onKeyPress("delete")}
            style={{ backgroundColor: isDark ? "#4A2C2A" : "#FFE8E2" }}
          >
            <Delete size={20} color={isDark ? "#FFFFFF" : "#000"} />
          </SideButton>
          <SideButton
            onPress={() => onKeyPress("calendar")}
            style={{ backgroundColor: isDark ? "#1A3A8A" : "#E5EFFF" }}
          >
            <Calendar size={20} color={isDark ? "#FFFFFF" : "#000"} />
          </SideButton>
          <ConfirmButton onPress={() => onKeyPress("confirm")} />
        </View>
      </View>
    </View>
  );
}
