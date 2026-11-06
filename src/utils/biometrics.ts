import * as LocalAuthentication from 'expo-local-authentication';
import { Platform } from 'react-native';

export interface BiometricStatus {
  isAvailable: boolean;
  hasHardware: boolean;
  isEnrolled: boolean;
  biometricType: 'fingerprint' | 'facial' | 'iris' | 'biometric' | 'none';
  biometricName: string;
}

export async function checkBiometrics(): Promise<BiometricStatus> {
  if (Platform.OS === 'web') {
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      biometricType: 'none',
      biometricName: 'Biometrics',
    };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const supportedTypes = await LocalAuthentication.supportedAuthenticationTypesAsync();

    let biometricType: 'fingerprint' | 'facial' | 'iris' | 'biometric' | 'none' = 'none';
    let biometricName = 'Biometrics';

    if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
      biometricType = 'facial';
      biometricName = Platform.OS === 'ios' ? 'Face ID' : 'Face Unlock';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
      biometricType = 'fingerprint';
      biometricName = Platform.OS === 'ios' ? 'Touch ID' : 'Fingerprint';
    } else if (supportedTypes.includes(LocalAuthentication.AuthenticationType.IRIS)) {
      biometricType = 'iris';
      biometricName = 'Iris Scanner';
    } else if (hasHardware) {
      biometricType = 'biometric';
      biometricName = 'Biometrics';
    }

    return {
      isAvailable: hasHardware && isEnrolled,
      hasHardware,
      isEnrolled,
      biometricType,
      biometricName,
    };
  } catch (err) {
    console.warn('Error checking biometric status:', err);
    return {
      isAvailable: false,
      hasHardware: false,
      isEnrolled: false,
      biometricType: 'none',
      biometricName: 'Biometrics',
    };
  }
}

export async function authenticateWithBiometrics(
  promptMessage = 'Authenticate with Biometrics to continue',
  fallbackToPin = true
): Promise<{ success: boolean; error?: string; notEnrolled?: boolean }> {
  if (Platform.OS === 'web') {
    return { success: true };
  }

  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    if (!hasHardware) {
      return { success: false, error: 'Biometric hardware is not available on this device.' };
    }

    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    if (!isEnrolled) {
      return {
        success: false,
        notEnrolled: true,
        error: 'No fingerprint or biometric credentials are enrolled on this device/emulator.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      cancelLabel: 'Cancel',
      fallbackLabel: fallbackToPin ? 'Use PIN' : undefined,
      disableDeviceFallback: !fallbackToPin,
    });

    if (result.success) {
      return { success: true };
    }

    return {
      success: false,
      error: result.error || 'Authentication was cancelled or failed.',
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Biometric authentication encountered an error.',
    };
  }
}
