import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

// Import Screen Auth & Home
import LoginScreen from '../Screens/Auth/Loginscreen';
import RegisterScreen from '../Screens/Auth/Registerscreen';
import HomeScreen from '../Screens/Home/HomeScreen';

// Import Screen Orders
import CartScreen from '../Screens/Orders/CartScreen';
import OrderScreen from '../Screens/Orders/OrderScreen';

// checkout 
import CheckoutScreen from '../Screens/Orders/CheckoutScreen'; 
import AddressScreen from '../Screens/Orders/AddressScreen';
import TrackingScreen from '../Screens/Orders/TrackingScreen';
import SuccessAmbilScreen from '../Screens/Orders/SuccessAmbilScreen';


const Stack = createStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Order" component={OrderScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Cart" component={CartScreen} options={{ headerShown: false }} />
        
        {/* 👇 2. DAFTARKAN RUTE CHECKOUT DI SINI */}
        <Stack.Screen name="Checkout" component={CheckoutScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Address" component={AddressScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Tracking" component={TrackingScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SuccessAmbil" component={SuccessAmbilScreen} options={{ headerShown: false }} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}