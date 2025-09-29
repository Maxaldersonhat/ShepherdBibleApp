import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Image, ImageSourcePropType, StyleSheet, Text } from "react-native";
import HomeScreen from "../screens/HomeScreen";
import BibleApp from "../screens/BibleScreen";
import Homeimage from "../assets/home.png";
import Bibleimage from "../assets/book.png";


export default function BottomTabNavigator() {
  const Tab = createBottomTabNavigator();

  const renderIcon = (icon: ImageSourcePropType, focused: boolean) => (
    <Image
      source={icon}
      style={[styles.icon, { tintColor: focused ? "#FF6531" : "#7f8c8d" }]}
    />
  );

  const renderLabel = (label: string, focused: boolean) => {
    return (
      <Text style={focused ? styles.focusedLabel : styles.labelText}>
        {label}
      </Text>
    );
  };

  return (
    <Tab.Navigator
      initialRouteName="HomeScreen"
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tab.Screen
        name="HomeScreen"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(Homeimage, focused),
          tabBarLabel: ({ focused }) => renderLabel("Home", focused),
        }}
      />
      <Tab.Screen
        name="BibleScreen"
        component={BibleApp}
        options={{
          tabBarIcon: ({ focused }) => renderIcon(Bibleimage, focused),
          tabBarLabel: ({ focused }) => renderLabel("Bible", focused),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: "#FFFFFF",
    height: 70, // Reduced height to be more standard
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 16, // More reasonable horizontal padding
    shadowColor: "rgba(0, 0, 0, 0.1)",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.8,
    shadowRadius: 3.84,
    elevation: 5,
  },
  icon: {
    width: 24,
    height: 24,
    marginBottom: 4, // Added space between icon and label
  },
  focusedLabel: {
    fontSize: 13.5,
    color: "#FF6531", // Matched with icon focus color
    fontFamily: "Futura",
    fontWeight: "500", // Changed to string format
    lineHeight: 18,
  },
  labelText: {
    fontSize: 13.5,
    color: "#7f8c8d", // Matched with icon unfocused color
    fontFamily: "Futura",
    fontWeight: "500", // Changed to string format
    lineHeight: 18,
  },
});

