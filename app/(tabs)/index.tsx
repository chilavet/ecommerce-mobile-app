import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Product, Category } from '@/src/types';
import { getProducts, getCategories } from '@/src/database/db';
import { ProductCard } from '@/src/components/ProductCard';
import { CategoryPill } from '@/src/components/CategoryPill';
import { SearchBar } from '@/src/components/SearchBar';
import { LocationPickerModal } from '@/src/components/LocationPickerModal';
import { useAuth } from '@/src/context/AuthContext';
import { useNotifications } from '@/src/context/NotificationContext';
import { useLocation } from '@/src/context/LocationContext';
import { openGoogleMaps } from '@/src/utils/location';

export default function ShopHomeScreen() {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();
  const { currentLocation, enrichAndSortProducts } = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortByDistance, setSortByDistance] = useState<boolean>(true);
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const loadData = async () => {
    try {
      const [cats, prods, featured] = await Promise.all([
        getCategories(),
        getProducts({ categoryId: selectedCategoryId, query: searchQuery }),
        getProducts({ featuredOnly: true }),
      ]);
      setCategories(cats);
      setProducts(enrichAndSortProducts(prods, sortByDistance));
      setFeaturedProducts(enrichAndSortProducts(featured, sortByDistance));
    } catch (err) {
      console.error('Error loading home data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedCategoryId, searchQuery]);

  useEffect(() => {
    setProducts(prev => enrichAndSortProducts(prev, sortByDistance));
    setFeaturedProducts(prev => enrichAndSortProducts(prev, sortByDistance));
  }, [currentLocation, sortByDistance]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  return (
    <View style={{ flex: 1, backgroundColor: Colors.light.background }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Location Bar */}
        <View style={styles.topLocationBar}>
          <TouchableOpacity
            style={styles.locationSelector}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <View style={styles.locationPinCircle}>
              <Ionicons name="location" size={16} color={Colors.primary} />
            </View>
            <View style={styles.locationInfo}>
              <View style={styles.locationLabelRow}>
                <Text style={styles.locationLabel}>DELIVER TO</Text>
                <Ionicons name="chevron-down" size={12} color={Colors.primary} />
              </View>
              <Text style={styles.locationAddress} numberOfLines={1}>
                {currentLocation.name || currentLocation.city}
              </Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.mapsShortcutBtn}
            onPress={() =>
              openGoogleMaps(
                currentLocation.latitude,
                currentLocation.longitude,
                currentLocation.formattedAddress
              )
            }
            activeOpacity={0.7}
          >
            <Ionicons name="map" size={15} color="#EA4335" />
            <Text style={styles.mapsShortcutText}>Maps</Text>
          </TouchableOpacity>
        </View>

        {/* Header Greeting & Notifications */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.userName}>{user ? user.name : 'Guest Shopper'} 👋</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationBtn}
            onPress={() => router.push('/notifications')}
            accessibilityLabel="Notifications"
            accessibilityRole="button"
          >
            <Ionicons
              name={unreadCount > 0 ? 'notifications' : 'notifications-outline'}
              size={22}
              color={unreadCount > 0 ? Colors.primary : Colors.light.text}
            />
            {unreadCount > 0 && (
              <View style={styles.unreadBadge}>
                <Text style={styles.unreadBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onClear={() => setSearchQuery('')}
          onFilterPress={() => router.push('/(tabs)/explore')}
        />

        {/* Proximity / Distance Sort Bar */}
        <View style={styles.proximityRow}>
          <View style={styles.proximityBadge}>
            <Ionicons name="compass-outline" size={15} color={Colors.primary} />
            <Text style={styles.proximityText} numberOfLines={1}>
              Stores near <Text style={{ fontWeight: '700' }}>{currentLocation.city}</Text>
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.sortPill, sortByDistance && styles.sortPillActive]}
            onPress={() => setSortByDistance(!sortByDistance)}
            activeOpacity={0.7}
          >
            <Ionicons
              name="swap-vertical"
              size={12}
              color={sortByDistance ? '#FFFFFF' : Colors.light.textSecondary}
            />
            <Text
              style={[
                styles.sortPillText,
                sortByDistance && styles.sortPillTextActive,
              ]}
            >
              {sortByDistance ? 'Nearest First 📍' : 'Standard'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Hero Promo Banner */}
        <View style={[styles.banner, Shadows.md]}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>LIMITED OFFER</Text>
          </View>
          <Text style={styles.bannerTitle}>Up to 20% OFF Everything</Text>
          <Text style={styles.bannerSubtitle}>Use promo code SAVE20 at checkout</Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => router.push('/(tabs)/explore')}
          >
            <Text style={styles.bannerBtnText}>Shop Now</Text>
            <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Categories Horizontal Scroll */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Categories</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesList}
        >
          {categories.map(category => (
            <CategoryPill
              key={category.id}
              category={category}
              isSelected={selectedCategoryId === category.id}
              onSelect={() => setSelectedCategoryId(category.id)}
            />
          ))}
        </ScrollView>

        {/* Featured Items (Distance Ordered) */}
        {featuredProducts.length > 0 &&
          searchQuery.length === 0 &&
          selectedCategoryId === 'cat_all' && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Featured Deals 🔥</Text>
                <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {featuredProducts.map(product => (
                  <View key={product.id} style={{ width: 260, marginRight: 14 }}>
                    <ProductCard product={product} />
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

        {/* Main Product Grid */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>
              {searchQuery
                ? `Search Results (${products.length})`
                : sortByDistance
                ? 'Nearby Products (By Proximity)'
                : 'All Products'}
            </Text>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 20 }} />
          ) : products.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="search-outline" size={48} color={Colors.light.textMuted} />
              <Text style={styles.emptyTitle}>No products found</Text>
              <Text style={styles.emptySubtitle}>Try adjusting your search terms or filter.</Text>
            </View>
          ) : (
            <View style={styles.productGrid}>
              {products.map(product => (
                <View key={product.id} style={styles.gridItem}>
                  <ProductCard product={product} />
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Location Picker Modal */}
      <LocationPickerModal
        visible={locationModalVisible}
        onClose={() => setLocationModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  contentContainer: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  topLocationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  locationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  locationPinCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  locationInfo: {
    flex: 1,
  },
  locationLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  locationAddress: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 1,
  },
  mapsShortcutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF1F2',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  mapsShortcutText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E11D48',
  },
  proximityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  proximityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 5,
    flex: 1,
    marginRight: 8,
  },
  proximityText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  sortPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
    gap: 4,
  },
  sortPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortPillText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  sortPillTextActive: {
    color: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  greeting: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  userName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.light.text,
  },
  notificationBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  unreadBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  unreadBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  banner: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  bannerBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  bannerBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  bannerSubtitle: {
    color: '#E0E7FF',
    fontSize: 13,
    marginBottom: 16,
  },
  bannerBtn: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  bannerBtnText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 13,
    marginRight: 6,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  categoriesList: {
    paddingVertical: 4,
    marginBottom: Spacing.md,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
});
