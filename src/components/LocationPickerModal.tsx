import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, Shadows } from '../constants/theme';
import { useLocation } from '../context/LocationContext';
import { useTheme } from '../context/ThemeContext';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const { colors, isDark } = useTheme();
  const {
    currentLocation,
    loadingLocation,
    setCustomAddress,
    requestDeviceLocation,
  } = useLocation();

  const [customInput, setCustomInput] = useState<string>('');

  const handleUseGPS = async () => {
    const res = await requestDeviceLocation();
    if (res.success) {
      Alert.alert('Location Updated 📍', res.message, [
        { text: 'OK', onPress: onClose },
      ]);
    } else {
      Alert.alert('Location Permission', res.message);
    }
  };

  const handleApplyCustom = () => {
    if (!customInput.trim()) {
      Alert.alert('Invalid Address', 'Please enter a city or area in Nigeria.');
      return;
    }
    setCustomAddress(customInput.trim(), customInput.trim());
    setCustomInput('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.sheetContainer, { backgroundColor: colors.modalBg }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <View>
              <Text style={[styles.title, { color: colors.text }]}>Delivery Area</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Select your area or state in Nigeria
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Current Selected Delivery Area */}
            <View style={[styles.currentAreaCard, { backgroundColor: colors.subCard, borderColor: colors.border }]}>
              <View style={[styles.currentAreaIconCircle, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
                <Ionicons name="location" size={18} color={Colors.primary} />
              </View>
              <View style={styles.currentAreaContent}>
                <Text style={[styles.currentAreaLabel, { color: colors.textMuted }]}>SELECTED AREA</Text>
                <Text style={[styles.currentAreaText, { color: colors.text }]} numberOfLines={1}>
                  {currentLocation.formattedAddress || currentLocation.name}
                </Text>
              </View>
              <Ionicons name="checkmark-circle" size={20} color="#16A34A" />
            </View>

            {/* GPS Auto-detect Button */}
            <TouchableOpacity
              style={[styles.gpsCard, { backgroundColor: colors.subCard, borderColor: colors.border }, Shadows.sm]}
              onPress={handleUseGPS}
              disabled={loadingLocation}
              activeOpacity={0.8}
            >
              <View style={styles.gpsIconCircle}>
                {loadingLocation ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="navigate" size={20} color="#FFFFFF" />
                )}
              </View>
              <View style={styles.gpsContent}>
                <Text style={[styles.gpsTitle, { color: colors.text }]}>Use Current Location (GPS)</Text>
                <Text style={[styles.gpsSubtitle, { color: colors.textSecondary }]}>
                  Auto-detect your current state and city in Nigeria
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>

            {/* Custom Address Input */}
            <View style={styles.inputSection}>
              <Text style={[styles.sectionLabel, { color: colors.textMuted }]}>ENTER AREA OR CITY</Text>
              <View style={[styles.inputRow, { backgroundColor: colors.inputBg, borderColor: colors.inputBorder }]}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={colors.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text }]}
                  placeholder="e.g. Surulere, Lagos or Garki, Abuja"
                  placeholderTextColor={colors.textMuted}
                  value={customInput}
                  onChangeText={setCustomInput}
                  returnKeyType="done"
                  onSubmitEditing={handleApplyCustom}
                />
                <TouchableOpacity
                  style={[
                    styles.applyBtn,
                    !customInput.trim() && styles.applyBtnDisabled,
                  ]}
                  onPress={handleApplyCustom}
                  disabled={!customInput.trim()}
                >
                  <Text style={styles.applyBtnText}>Set</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  closeBtn: {
    padding: 6,
  },
  scroll: {
    flexGrow: 0,
  },
  scrollContent: {
    padding: Spacing.md,
    gap: 16,
  },
  currentAreaCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  currentAreaIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  currentAreaContent: {
    flex: 1,
    marginRight: 8,
  },
  currentAreaLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803D',
    letterSpacing: 0.6,
  },
  currentAreaText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 2,
  },
  gpsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    padding: 14,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  gpsIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  gpsContent: {
    flex: 1,
    marginRight: 8,
  },
  gpsTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.primary,
  },
  gpsSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  inputSection: {
    gap: 6,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.inputBg,
    borderRadius: BorderRadius.md,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.sm,
  },
  applyBtnDisabled: {
    backgroundColor: Colors.light.textMuted,
    opacity: 0.6,
  },
  applyBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

