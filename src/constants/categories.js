import {
  Utensils,
  Car,
  Wifi,
  Printer,
  MoreHorizontal,
} from "lucide-react-native";

// Nigerian student-specific expense categories
export const CATEGORIES = [
  {
    id: "food",
    name: "Food (Mama Put)",
    icon: Utensils,
    lightColor: "#E9FFE9",
    darkColor: "#1A4D2E",
  },
  {
    id: "transport",
    name: "Transport (Keke/Cab)",
    icon: Car,
    lightColor: "#E9F0FF",
    darkColor: "#1A3A8A",
  },
  {
    id: "data",
    name: "Data/Airtime",
    icon: Wifi,
    lightColor: "#FEF0B8",
    darkColor: "#4A4A2E",
  },
  {
    id: "printing",
    name: "Printing/Photocopy",
    icon: Printer,
    lightColor: "#D8CCFF",
    darkColor: "#3A2A4A",
  },
  {
    id: "misc",
    name: "Miscellaneous",
    icon: MoreHorizontal,
    lightColor: "#FFE8E2",
    darkColor: "#4A2C2A",
  },
];

export const getCategoryById = (id) => {
  return CATEGORIES.find((cat) => cat.id === id) || CATEGORIES[4]; // Default to Miscellaneous
};

export const getCategoryColor = (categoryId, isDark = false) => {
  const category = getCategoryById(categoryId);
  return isDark ? category.darkColor : category.lightColor;
};
