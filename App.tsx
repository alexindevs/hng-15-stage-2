import { Archivo_800ExtraBold } from "@expo-google-fonts/archivo/800ExtraBold";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { DarkTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useFonts } from "expo-font";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider, useAuth } from "./src/context/AuthContext";
import { CartProvider, useCart } from "./src/context/CartContext";
import { Ionicons } from "@expo/vector-icons";
import AboutScreen from "./src/screens/AboutScreen";
import BookScreen from "./src/screens/BookScreen";
import BookingScreen from "./src/screens/BookingScreen";
import CheckoutScreen from "./src/screens/CheckoutScreen";
import ContactScreen from "./src/screens/ContactScreen";
import GalleryScreen from "./src/screens/GalleryScreen";
import HomeScreen from "./src/screens/HomeScreen";
import MoreScreen from "./src/screens/MoreScreen";
import OrderScreen from "./src/screens/OrderScreen";
import AccountScreen from "./src/screens/AccountScreen";
import CartScreen from "./src/screens/CartScreen";
import LoginScreen from "./src/screens/LoginScreen";
import ProductScreen from "./src/screens/ProductScreen";
import ShopScreen from "./src/screens/ShopScreen";
import { colors, fonts } from "./src/theme";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.ink, card: colors.coal, text: colors.bone, border: colors.line, primary: colors.gold },
};
const headerOpts = {
  headerStyle: { backgroundColor: colors.coal },
  headerTintColor: colors.gold,
  headerTitleStyle: { fontFamily: fonts.display, color: colors.bone },
  contentStyle: { backgroundColor: colors.ink },
};

const ICONS: Record<string, [keyof typeof Ionicons.glyphMap, keyof typeof Ionicons.glyphMap]> = {
  Home: ["home", "home-outline"],
  Shop: ["car-sport", "car-sport-outline"],
  Cart: ["cart", "cart-outline"],
  Account: ["person", "person-outline"],
  More: ["menu", "menu-outline"],
};

function Tabs() {
  const { count } = useCart();
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        ...headerOpts,
        tabBarStyle: { backgroundColor: colors.coal, borderTopColor: colors.line },
        tabBarActiveTintColor: colors.gold,
        tabBarInactiveTintColor: colors.mute,
        tabBarLabelStyle: { fontFamily: fonts.semi, fontSize: 11 },
        tabBarBadgeStyle: { backgroundColor: colors.gold, color: "#0a0a0a" },
        tabBarIcon: ({ focused, color, size }) => <Ionicons name={ICONS[route.name][focused ? 0 : 1]} size={size} color={color} />,
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: "Ego Olisa" }} />
      <Tab.Screen name="Shop" component={ShopScreen} options={{ title: "Shop" }} />
      <Tab.Screen name="Cart" component={CartScreen} options={{ tabBarBadge: count > 0 ? count : undefined }} />
      <Tab.Screen name="Account" component={AccountScreen} />
      <Tab.Screen name="More" component={MoreScreen} />
    </Tab.Navigator>
  );
}

function Root() {
  const { session, guest, loading } = useAuth();
  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.ink, justifyContent: "center" }}>
        <ActivityIndicator color={colors.gold} />
      </View>
    );
  }
  const authed = !!session || guest;
  return (
    <Stack.Navigator screenOptions={headerOpts}>
      {authed ? (
        <>
          <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
          <Stack.Screen name="Product" component={ProductScreen} options={{ title: "Vehicle" }} />
          <Stack.Screen name="Checkout" component={CheckoutScreen} />
          <Stack.Screen name="Order" component={OrderScreen} options={{ title: "Your order" }} />
          <Stack.Screen name="Book" component={BookScreen} options={{ title: "Book a viewing" }} />
          <Stack.Screen name="Booking" component={BookingScreen} options={{ title: "Your viewing" }} />
          <Stack.Screen name="Gallery" component={GalleryScreen} />
          <Stack.Screen name="About" component={AboutScreen} />
          <Stack.Screen name="Contact" component={ContactScreen} />
          {!session && (
            <Stack.Screen name="Login" options={{ headerShown: false, presentation: "modal" }}>
              {() => <LoginScreen />}
            </Stack.Screen>
          )}
        </>
      ) : (
        <Stack.Screen name="Login" options={{ headerShown: false }}>
          {() => <LoginScreen />}
        </Stack.Screen>
      )}
    </Stack.Navigator>
  );
}

export default function App() {
  const [loaded] = useFonts({ Archivo_800ExtraBold, Inter_400Regular, Inter_600SemiBold });
  if (!loaded) return <View style={{ flex: 1, backgroundColor: colors.ink }} />;
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <NavigationContainer theme={navTheme}>
            <StatusBar style="light" />
            <Root />
          </NavigationContainer>
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
