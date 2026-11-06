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
        {/* Top Location Indicator */}
        <View style={styles.topLocationBar}>
          <TouchableOpacity
            style={styles.locationIndicator}
            onPress={() => setLocationModalVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="location-sharp" size={15} color={Colors.primary} />
            <Text style={styles.deliverToLabel}>Deliver to:</Text>
            <Text style={styles.selectedAreaText} numberOfLines={1}>
              {currentLocation.city || currentLocation.name}
            </Text>
            <Ionicons name="chevron-down" size={13} color={Colors.light.textSecondary} />
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
          onFilterPress={() => setSelectedCategoryId('cat_all')}
        />

        {/* Hero Promo Banner */}
        <View style={[styles.banner, Shadows.md]}>
          <View style={styles.bannerBadge}>
            <Text style={styles.bannerBadgeText}>LIMITED OFFER</Text>
          </View>
          <Text style={styles.bannerTitle}>Up to 20% OFF Everything</Text>
          <Text style={styles.bannerSubtitle}>Use promo code SAVE20 at checkout</Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={() => setSelectedCategoryId('cat_all')}
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
                <TouchableOpacity onPress={() => setSelectedCategoryId('cat_all')}>
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
    marginBottom: Spacing.xs,
    paddingVertical: 2,
  },
  locationIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  deliverToLabel: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '400',
  },
  selectedAreaText: {
    fontSize: 13,
    color: Colors.light.text,
    fontWeight: '600',
    maxWidth: 240,
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
