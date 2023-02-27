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

const APP_URL = 'https://eacloudapp4.makeweb.hu/?v=' + Date.now();
const APP_BACKGROUND_COLOR = "#fff";

export default function App() {
  // States
  const [showQrScanner, setShowQrScanner] = React.useState(false);

  // Keep splash screen for 3 seconds
  setTimeout(() => {
    SplashScreen.hideAsync();
  }, 3000);

  // Lock screen orientation
  ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);

  const showQrScannerModal = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    if (status === 'granted') {
      setShowQrScanner(true);
    } else {
      Alert.alert('Nincs engedélyezve a kamera', 'Engedélyeznie kell a kamerát az alkalmazás számára.');
    }
  };

  const hideQrScannerModal = () => {
    setShowQrScanner(false);
  };

  const handleQrScanned = (data) => {
    sendMessageToWebView(["qrScanned", data]);
  };

  const openBrowser = async (url) => {
    try {
      const result = await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Hiba történt', 'Nem sikerült megnyitni a böngészőt.');
    }
  };

  const openAuthBrowser = async (url) => {
    try {
      const result = await WebBrowser.openAuthSessionAsync(url, Constants.linkingUri);
    } catch (e) {
      Alert.alert('Hiba történt', 'Nem sikerült megnyitni a böngészőt.');
    }
  };

  const sendMessageToWebView = (data) => {
    if (this.webView) {
      this.webView.injectJavaScript(`
        window.ReactNativeMessageCallback(${ JSON.stringify(data) });
      `);
    }
  };

  const receiveMessageFromWebView = async (data) => {
    if (Array.isArray(data) && data.length >= 1) {
      switch (data[0]) {
      case "init":
        sendMessageToWebView(["deep_uri", Constants.linkingUri]);
        try {
          sendMessageToWebView(["session_id", (await AsyncStorage.getItem('session_id@wekings')) || '']);
        } catch (e) {
          sendMessageToWebView(["session_id", '']);
        }
        try {
          sendMessageToWebView(["platform", {
            platform: Constants.platform.adroid ? "android" : "ios",
            app_version: Application.nativeAppVersion,
            build_version: Application.nativeBuildVersion,
            device_name: Device.deviceName,
            os_name: Device.osName,
            os_version: Device.osVersion,
            brand: Device.brand,
            manufacturer: Device.manufacturer,
            model: Device.modelName,
            year: Device.deviceYearClass,
            total_memory: Device.totalMemory,
            cpu: Device.supportedCpuArchitectures,
            screen_width: Dimensions.get('screen').width,
            screen_height: Dimensions.get('screen').height,
            screen_scale: Dimensions.get('screen').scale,
            locale: Localization.locale,
          }]);
        } catch (ignore) {
          sendMessageToWebView(["platform", {}]);
        }
        break;
      case "openQrScanner":
        showQrScannerModal();
        break;
      case "closeQrScanner":
        hideQrScannerModal();
        break;
      case "openBrowser":
        openBrowser(String(data[1]));
        break;
      case "openAuthBrowser":
        openAuthBrowser(String(data[1]));
        break;
      case "saveSession":
        try {
          await AsyncStorage.setItem('session_id@wekings', String(data[1]));
        } catch (e) {
          void(0);
        }
        break;
      case "clearSession":
        try {
          await AsyncStorage.setItem('session_id@wekings', '');
        } catch (e) {
          void(0);
        }
        break;
      default:
        Alert.alert('Hiba történt', 'Nem megfelelő üzenet.');
        break;
      }
    } else {
      Alert.alert('Hiba történt', 'Nem megfelelő üzenetformátum.');
    }
  };

  return (
    <SafeAreaView style={{flex: 1, paddingTop: Constants.statusBarHeight, backgroundColor: APP_BACKGROUND_COLOR}}>
      <WebView 
        ref={(view) => this.webView = view}
        style={{flex: 1}}
        scrollEnabled={false}
        onMessage={(event) => {
          // Handle events from WebView
          try {
            const jsValue = JSON.parse(event.nativeEvent.data || "null");
            receiveMessageFromWebView(jsValue);
          } catch (ignore) {
            receiveMessageFromWebView(null);
          }
        }}
        source={{uri: APP_URL}}
      />
      {
        showQrScanner
          ? <Camera style={StyleSheet.absoluteFillObject} onBarCodeScanned={handleQrScanned}>
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={{flex: 1, alignSelf: 'flex-end', alignItems: 'center'}}>
                <Text style={styles.text} onPress={() => {
                  hideQrScannerModal();
                  sendMessageToWebView(["qrScannerCancelled"]);
                }}> Mégse </Text>
              </TouchableOpacity>
            </View>
          </Camera>
          : undefined
      }
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
  },
  text: {
    fontSize: 18,
    color: 'white',
  },
});
