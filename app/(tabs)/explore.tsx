import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Colors, Spacing, BorderRadius } from '@/src/constants/theme';
import { Product, Category } from '@/src/types';
import { getProducts, getCategories } from '@/src/database/db';
import { ProductCard } from '@/src/components/ProductCard';
import { SearchBar } from '@/src/components/SearchBar';
import { LocationPickerModal } from '@/src/components/LocationPickerModal';
import { useLocation } from '@/src/context/LocationContext';

type SortOption = 'distance' | 'popular' | 'rating' | 'price-asc' | 'price-desc';

export default function ExploreScreen() {
  const { currentLocation, enrichAndSortProducts } = useLocation();

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('distance');
  const [locationModalVisible, setLocationModalVisible] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({
            categoryId: selectedCategoryId,
            query: searchQuery,
            sortBy: sortBy === 'distance' ? undefined : sortBy,
          }),
        ]);
        setCategories(cats);
        setProducts(enrichAndSortProducts(prods, sortBy === 'distance'));
      } catch (err) {
        console.error('Error in explore search:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategoryId, searchQuery, sortBy, currentLocation]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Nearest (Distance) 📍', value: 'distance' },
    { label: 'Popular', value: 'popular' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        {/* Search Bar */}
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by title, brand, or tag..."
          onClear={() => setSearchQuery('')}
        />

        {/* Location Banner */}
        <TouchableOpacity
          style={styles.locationBanner}
          onPress={() => setLocationModalVisible(true)}
          activeOpacity={0.7}
        >
          <Ionicons name="location-sharp" size={14} color={Colors.primary} />
          <Text style={styles.locationBannerText} numberOfLines={1}>
            Distance relative to: <Text style={{ fontWeight: '700' }}>{currentLocation.name || currentLocation.city}</Text>
          </Text>
          <Text style={styles.changeLocationText}>Change</Text>
        </TouchableOpacity>

        {/* Categories Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
          {categories.map(cat => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryChip,
                selectedCategoryId === cat.id && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategoryId(cat.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategoryId === cat.id && styles.categoryChipTextActive,
                ]}
              >
                {cat.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Sort Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortScroll}>
          {sortOptions.map(opt => (
            <TouchableOpacity
              key={opt.value}
              style={[styles.sortChip, sortBy === opt.value && styles.sortChipActive]}
              onPress={() => setSortBy(opt.value)}
            >
              <Text style={[styles.sortChipText, sortBy === opt.value && styles.sortChipTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <View style={styles.resultsInfo}>
          <Text style={styles.resultsCount}>
            Showing <Text style={{ fontWeight: '700', color: Colors.light.text }}>{products.length}</Text> items
          </Text>
          {(selectedCategoryId !== 'cat_all' || searchQuery.length > 0) && (
            <TouchableOpacity
              onPress={() => {
                setSelectedCategoryId('cat_all');
                setSearchQuery('');
              }}
            >
              <Text style={styles.resetFilterText}>Clear Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Product List / Grid */}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search-outline" size={48} color={Colors.light.textMuted} />
          <Text style={styles.emptyTitle}>No matching items found</Text>
          <Text style={styles.emptySubtitle}>Try adjusting your search terms or filters.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollList} showsVerticalScrollIndicator={false}>
          <View style={styles.productGrid}>
            {products.map(product => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        </ScrollView>
      )}

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
  topSection: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.sm,
    marginBottom: 8,
    gap: 5,
  },
  locationBannerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    flex: 1,
  },
  changeLocationText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.inputBg,
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  categoryChipTextActive: {
    color: '#FFFFFF',
  },
  sortScroll: {
    marginBottom: 12,
  },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  sortChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  sortChipTextActive: {
    color: '#FFFFFF',
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 10,
  },
  resultsCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
  },
  scrollList: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  gridItem: {
    width: '48%',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
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
    textAlign: 'center',
    marginTop: 4,
  },
});
