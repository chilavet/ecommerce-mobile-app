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
import { UserLocation } from '../types';
import { openGoogleMaps, openGoogleMapsSearch } from '../utils/location';

interface LocationPickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export const LocationPickerModal: React.FC<LocationPickerModalProps> = ({
  visible,
  onClose,
}) => {
  const {
    currentLocation,
    presetLocations,
    loadingLocation,
    setLocation,
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

  const handleSelectPreset = (loc: UserLocation) => {
    setLocation(loc);
    onClose();
  };

  const handleApplyCustom = () => {
    if (!customInput.trim()) {
      Alert.alert('Invalid Address', 'Please enter a city or address.');
      return;
    }
    setCustomAddress(customInput.trim(), customInput.trim());
    setCustomInput('');
    onClose();
  };

  const handleOpenGoogleMaps = () => {
    openGoogleMaps(
      currentLocation.latitude,
      currentLocation.longitude,
      currentLocation.formattedAddress
    );
  };

  const handleSearchGoogleMaps = () => {
    const query = customInput.trim() || currentLocation.formattedAddress;
    openGoogleMapsSearch(query);
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Choose Delivery Location</Text>
              <Text style={styles.subtitle}>
                Items and stores will sort according to proximity
              </Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* GPS Auto-detect Button */}
            <TouchableOpacity
              style={[styles.gpsCard, Shadows.sm]}
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
                <Text style={styles.gpsTitle}>Use Current Location (GPS)</Text>
                <Text style={styles.gpsSubtitle}>
                  Accurately detect your device position & calculate store distances
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={Colors.primary} />
            </TouchableOpacity>

            {/* Google Maps Actions */}
            <View style={styles.mapsActionRow}>
              <TouchableOpacity
                style={[styles.mapsBtn, Shadows.sm]}
                onPress={handleOpenGoogleMaps}
                activeOpacity={0.8}
              >
                <Ionicons name="map" size={18} color="#EA4335" />
                <Text style={styles.mapsBtnText}>Open in Google Maps</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mapsBtn, Shadows.sm]}
                onPress={handleSearchGoogleMaps}
                activeOpacity={0.8}
              >
                <Ionicons name="search" size={18} color="#4285F4" />
                <Text style={styles.mapsBtnText}>Search Area Maps</Text>
              </TouchableOpacity>
            </View>

            {/* Custom Address Input */}
            <View style={styles.inputSection}>
              <Text style={styles.sectionLabel}>ENTER ADDRESS OR CITY</Text>
              <View style={styles.inputRow}>
                <Ionicons
                  name="location-outline"
                  size={20}
                  color={Colors.light.textMuted}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Austin, TX or 500 Market St"
                  placeholderTextColor={Colors.light.textMuted}
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

            {/* Preset City Hubs */}
            <View style={styles.presetsSection}>
              <Text style={styles.sectionLabel}>POPULAR HUBS &amp; CITIES</Text>
              {presetLocations.map(loc => {
                const isSelected =
                  currentLocation.latitude === loc.latitude &&
                  currentLocation.longitude === loc.longitude;

                return (
                  <TouchableOpacity
                    key={loc.id || loc.formattedAddress}
                    style={[
                      styles.presetCard,
                      isSelected && styles.presetCardSelected,
                    ]}
                    onPress={() => handleSelectPreset(loc)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.presetIconCircle,
                        isSelected && styles.presetIconCircleSelected,
                      ]}
                    >
                      <Ionicons
                        name="business"
                        size={18}
                        color={isSelected ? '#FFFFFF' : Colors.light.textSecondary}
                      />
                    </View>
                    <View style={styles.presetContent}>
                      <Text
                        style={[
                          styles.presetName,
                          isSelected && styles.presetNameSelected,
                        ]}
                      >
                        {loc.name}
                      </Text>
                      <Text style={styles.presetAddress} numberOfLines={1}>
                        {loc.formattedAddress}
                      </Text>
                    </View>
                    {isSelected ? (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={Colors.primary}
                      />
                    ) : (
                      <Ionicons
                        name="chevron-forward"
                        size={16}
                        color={Colors.light.textMuted}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
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
  mapsActionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  mapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  mapsBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
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
  presetsSection: {
    gap: 8,
  },
  presetCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  presetCardSelected: {
    borderColor: Colors.primary,
    backgroundColor: '#F8FAFF',
  },
  presetIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.inputBg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  presetIconCircleSelected: {
    backgroundColor: Colors.primary,
  },
  presetContent: {
    flex: 1,
    marginRight: 8,
  },
  presetName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  presetNameSelected: {
    fontWeight: '800',
    color: Colors.primary,
  },
  presetAddress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
});

