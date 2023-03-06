import * as React from 'react';
import { WebView } from 'react-native-webview';
import { StyleSheet, Button, Alert, Dimensions, View, TouchableOpacity, Text } from 'react-native';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { Platform } from 'react-native';
import { SafeAreaView } from 'react-navigation';
import { Camera, CameraType } from 'expo-camera';
import * as WebBrowser from 'expo-web-browser';
import * as Device from 'expo-device';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import * as Localization from 'expo-localization';
import * as Application from 'expo-application';

SplashScreen.preventAutoHideAsync();

const APP_URL = 'https://app.eacloud.hu/?v=' + Date.now();

export default function App() {

  // Keep splash screen for 3 seconds
  setTimeout(() => {
    SplashScreen.hideAsync();
  }, 3000);

  // Lock screen orientation
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  return (
      <WebView 
        style={{flex: 1}}
        source={{uri: APP_URL}}
      />
  );
}