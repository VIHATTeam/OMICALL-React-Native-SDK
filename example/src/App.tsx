import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { UIColors } from './components';
import { LoginScreen } from './login';
import { Alert } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import React, { useEffect } from 'react';
import { HomeScreen } from './home';

const Stack = createNativeStackNavigator();

export default function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    const unsubscribe = messaging().onMessage(async (remoteMessage) => {
      Alert.alert('A new FCM message arrived!', JSON.stringify(remoteMessage));
    });

    return unsubscribe;
  }, []);

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName="Login"
        screenOptions={{
          headerStyle: { backgroundColor: UIColors.mainColor },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
            color: '#fff',
            fontSize: 18,
          },
          statusBarColor: UIColors.mainColor,
          headerBackTitleVisible: false,
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Home',
          }}
        />
        {/* <Stack.Screen name="Detail" component={DetailScreen} />
        <Stack.Screen name="Tips" component={TipsScreen} />
        <Stack.Screen name="Signs" component={SignScreen} />
        <Stack.Screen name="SignDetail" component={SignDetailScreen} /> */}
      </Stack.Navigator>
    </NavigationContainer>
    // <View style={styles.container}>
    //   <Text>Result: {result}</Text>
    // </View>
  );
}

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     alignItems: 'center',
//     justifyContent: 'center',
//   },
//   box: {
//     width: 60,
//     height: 60,
//     marginVertical: 20,
//   },
// });
