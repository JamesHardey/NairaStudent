import * as Haptics from "expo-haptics";
import { Platform } from "react-native";

// Light tap feedback for general interactions
export const triggerLight = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }
};

// Medium tap feedback for button presses
export const triggerMedium = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }
};

// Heavy tap feedback for important actions
export const triggerHeavy = () => {
  if (Platform.OS !== "web") {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  }
};

// Success feedback for completed actions
export const triggerSuccess = () => {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }
};

// Warning feedback for caution situations
export const triggerWarning = () => {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  }
};

// Error feedback for failed actions
export const triggerError = () => {
  if (Platform.OS !== "web") {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }
};

// Selection feedback for picker/dropdown changes
export const triggerSelection = () => {
  if (Platform.OS !== "web") {
    Haptics.selectionAsync();
  }
};
