import {
  NavigationContainer,
  useNavigationContainerRef,
} from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { UIColors } from './components';
import { LoginScreen } from './login';
import { HomeScreen } from './home';
import { DialCallScreen } from './dial_call';
import { VideoCallScreen } from './video_call';

const Stack = createNativeStackNavigator();

interface AppProps {
  isLogin: boolean;
}

/**
 * Expo example navigation. Same login → home → call flow as the bare RN
 * example, trimmed to the screens that exercise the SDK (no TestEvents /
 * ApiKey screens). The OmiKit native init runs automatically via the Expo
 * lifecycle subscriber shipped in omikit-plugin — no AppDelegate/MainActivity
 * edits, unlike the bare example.
 */
export const App = ({ isLogin }: AppProps) => {
  const navigationRef = useNavigationContainerRef();

  return (
    <NavigationContainer ref={navigationRef}>
      <Stack.Navigator
        initialRouteName={isLogin ? 'Home' : 'Login'}
        screenOptions={{
          headerStyle: { backgroundColor: UIColors.mainColor },
          headerTintColor: '#fff',
          headerTitleStyle: {
            fontWeight: '700',
            color: '#fff',
            fontSize: 18,
          },
        }}
      >
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
        {/* DialCall/VideoCall read `route.params` via a plain prop signature.
            react-navigation injects `route` at runtime; cast keeps strict TS
            happy without changing the ported screen code. */}
        <Stack.Screen
          name="DialCall"
          component={DialCallScreen as React.ComponentType<any>}
          options={{ headerShown: false, gestureEnabled: true }}
        />
        <Stack.Screen
          name="VideoCall"
          component={VideoCallScreen as React.ComponentType<any>}
          options={{ headerShown: false, gestureEnabled: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};
