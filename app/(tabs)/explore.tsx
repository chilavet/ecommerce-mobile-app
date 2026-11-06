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

type SortOption = 'popular' | 'rating' | 'price-asc' | 'price-desc';

export default function ExploreScreen() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('cat_all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortOption>('popular');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function load() {
      try {
        const [cats, prods] = await Promise.all([
          getCategories(),
          getProducts({
            categoryId: selectedCategoryId,
            query: searchQuery,
            sortBy,
          }),
        ]);
        setCategories(cats);
        setProducts(prods);
      } catch (err) {
        console.error('Error in explore search:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [selectedCategoryId, searchQuery, sortBy]);

  const sortOptions: { label: string; value: SortOption }[] = [
    { label: 'Popular', value: 'popular' },
    { label: 'Top Rated', value: 'rating' },
    { label: 'Price: Low to High', value: 'price-asc' },
    { label: 'Price: High to Low', value: 'price-desc' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.topSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Filter by title, brand, or tag..."
          onClear={() => setSearchQuery('')}
        />

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
              <Text style={styles.resetText}>Reset Filters</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {loading ? (
          <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 40 }} />
        ) : products.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search" size={54} color={Colors.light.textMuted} />
            <Text style={styles.emptyTitle}>No matching products</Text>
            <Text style={styles.emptySubtitle}>Try changing your search query or sorting.</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {products.map(product => (
              <View key={product.id} style={styles.gridItem}>
                <ProductCard product={product} />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    paddingTop: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  categoryScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: BorderRadius.full,
    backgroundColor: '#F1F5F9',
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
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 6,
  },
  sortChipActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  sortChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  sortChipTextActive: {
    color: Colors.primaryDark,
  },
  resultsInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  resultsCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  resetText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  grid: {
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
    paddingVertical: 60,
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
