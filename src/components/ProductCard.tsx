import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Product } from '../types';
import { Colors, BorderRadius, Shadows, Spacing } from '../constants/theme';
import { useCart } from '../context/CartContext';
import { router } from 'expo-router';

interface ProductCardProps {
  product: Product;
  horizontal?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, horizontal }) => {
  const { addToCart } = useCart();

  const handlePress = () => {
    router.push({
      pathname: '/product/[id]',
      params: { id: product.id },
    });
  };

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  if (horizontal) {
    return (
      <Pressable onPress={handlePress} style={[styles.horizontalCard, Shadows.sm]}>
        <Image source={{ uri: product.imageUrl }} style={styles.horizontalImage} resizeMode="cover" />
        <View style={styles.horizontalContent}>
          <Text style={styles.brand}>{product.brand}</Text>
          <Text style={styles.title} numberOfLines={2}>
            {product.title}
          </Text>
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={14} color={Colors.accent} />
            <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewsCount}>({product.reviewsCount})</Text>
          </View>
          {product.distanceMiles !== undefined && (
            <View style={styles.distanceRow}>
              <Ionicons name="location-sharp" size={11} color={Colors.primary} />
              <Text style={styles.distanceText}>{product.distanceMiles.toFixed(1)} mi</Text>
            </View>
          )}
          <View style={styles.priceRow}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            <TouchableOpacity
              onPress={() => addToCart(product, 1)}
              style={styles.smallAddButton}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="add" size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} style={[styles.card, Shadows.md]}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />
        {discountPercent > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>-{discountPercent}%</Text>
          </View>
        )}
        {product.isFeatured && (
          <View style={[styles.badge, styles.featuredBadge]}>
            <Text style={styles.badgeText}>Featured</Text>
          </View>
        )}
      </View>

      <View style={styles.content}>
        <Text style={styles.brand}>{product.brand}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {product.title}
        </Text>

        <View style={styles.ratingRow}>
          <Ionicons name="star" size={14} color={Colors.accent} />
          <Text style={styles.ratingText}>{product.rating.toFixed(1)}</Text>
          <Text style={styles.reviewsCount}>({product.reviewsCount})</Text>
        </View>

        {product.distanceMiles !== undefined && (
          <View style={styles.distanceBadge}>
            <Ionicons name="location-sharp" size={12} color={Colors.primary} />
            <Text style={styles.distanceText}>
              {product.distanceMiles.toFixed(1)} mi away
            </Text>
            {product.location?.city && (
              <Text style={styles.distanceCity}> • {product.location.city}</Text>
            )}
          </View>
        )}

        <View style={styles.priceRow}>
          <View>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => addToCart(product, 1)}
            style={styles.addButton}
            activeOpacity={0.8}
          >
            <Ionicons name="cart-outline" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  imageContainer: {
    width: '100%',
    height: 170,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  badge: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: Colors.danger,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  featuredBadge: {
    left: 'auto',
    right: 10,
    backgroundColor: Colors.primary,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  content: {
    padding: Spacing.md,
  },
  brand: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.light.text,
    lineHeight: 20,
    marginBottom: 8,
    minHeight: 40,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviewsCount: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginLeft: 4,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.primary,
    marginLeft: 3,
  },
  distanceCity: {
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  price: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.primary,
  },
  originalPrice: {
    fontSize: 12,
    color: Colors.light.textMuted,
    textDecorationLine: 'line-through',
    marginTop: 1,
  },
  addButton: {
    backgroundColor: Colors.primary,
    width: 38,
    height: 38,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  horizontalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  horizontalImage: {
    width: 100,
    height: 100,
    backgroundColor: '#F8FAFC',
  },
  horizontalContent: {
    flex: 1,
    padding: Spacing.sm,
    justifyContent: 'center',
  },
  smallAddButton: {
    backgroundColor: Colors.primary,
    width: 28,
    height: 28,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

