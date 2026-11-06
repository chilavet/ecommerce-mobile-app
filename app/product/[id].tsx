import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router, Stack } from 'expo-router';

import { Colors, Spacing, BorderRadius, Shadows } from '@/src/constants/theme';
import { Product } from '@/src/types';
import { getProductById } from '@/src/database/db';
import { useCart } from '@/src/context/CartContext';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { addToCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);
  const [loading, setLoading] = useState<boolean>(true);
  const [addedToast, setAddedToast] = useState<boolean>(false);

  useEffect(() => {
    async function load() {
      if (!id) return;
      try {
        const prod = await getProductById(id);
        if (prod) {
          setProduct(prod);
          setSelectedImage(prod.imageUrl);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, quantity);
    setAddedToast(true);
    setTimeout(() => {
      setAddedToast(false);
    }, 2500);
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart(product, quantity);
    router.push('/checkout');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Ionicons name="alert-circle-outline" size={50} color={Colors.light.textMuted} />
        <Text style={styles.notFoundText}>Product not found</Text>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backBtnText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const discountPercent = product.originalPrice
    ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
    : 0;

  const imagesList = product.images && product.images.length > 0 ? product.images : [product.imageUrl];

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: product.brand,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={{ marginRight: 8 }}>
              <Ionicons name="cart-outline" size={24} color={Colors.light.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Main Image Showcase */}
        <View style={styles.heroImageContainer}>
          <Image source={{ uri: selectedImage }} style={styles.heroImage} resizeMode="cover" />
          {discountPercent > 0 && (
            <View style={styles.discountBadge}>
              <Text style={styles.discountBadgeText}>SAVE {discountPercent}%</Text>
            </View>
          )}
        </View>

        {/* Thumbnail Carousel */}
        {imagesList.length > 1 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.thumbnailRow}
          >
            {imagesList.map((img, idx) => (
              <TouchableOpacity
                key={idx}
                onPress={() => setSelectedImage(img)}
                style={[
                  styles.thumbnailWrapper,
                  selectedImage === img && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Details Container */}
        <View style={styles.detailsContainer}>
          {/* Brand & Stock */}
          <View style={styles.topRow}>
            <Text style={styles.brandText}>{product.brand}</Text>
            <View style={styles.stockBadge}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={styles.productTitle}>{product.title}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={styles.ratingNumber}>{product.rating.toFixed(1)}</Text>
            <Text style={styles.reviewCount}>({product.reviewsCount} verified reviews)</Text>
          </View>

          {/* Price Box */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>${product.price.toFixed(2)}</Text>
            {product.originalPrice && (
              <Text style={styles.oldPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
          </View>

          <View style={styles.divider} />

          {/* Description */}
          <Text style={styles.sectionHeader}>Overview</Text>
          <Text style={styles.descriptionText}>{product.description}</Text>

          {/* Specifications */}
          {product.specs && Object.keys(product.specs).length > 0 && (
            <View style={styles.specsSection}>
              <Text style={styles.sectionHeader}>Specifications</Text>
              <View style={styles.specsTable}>
                {Object.entries(product.specs).map(([key, val], idx) => (
                  <View
                    key={key}
                    style={[
                      styles.specRow,
                      idx % 2 === 0 ? styles.specRowEven : styles.specRowOdd,
                    ]}
                  >
                    <Text style={styles.specKey}>{key}</Text>
                    <Text style={styles.specValue}>{val}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={styles.sectionHeader}>Quantity</Text>
            <View style={styles.quantityPicker}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityBtn}
              >
                <Ionicons name="remove" size={18} color={Colors.light.text} />
              </TouchableOpacity>
              <Text style={styles.quantityValue}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                style={styles.quantityBtn}
              >
                <Ionicons name="add" size={18} color={Colors.light.text} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Toast Alert */}
      {addedToast && (
        <View style={[styles.toastContainer, Shadows.lg]}>
          <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
          <Text style={styles.toastText}>Added to your shopping cart!</Text>
        </View>
      )}

      {/* Sticky Bottom Actions */}
      <View style={[styles.bottomBar, Shadows.lg]}>
        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={handleAddToCart}
          activeOpacity={0.8}
        >
          <Ionicons name="cart-outline" size={20} color={Colors.primary} />
          <Text style={styles.addToCartText}>Add to Cart</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.buyNowBtn}
          onPress={handleBuyNow}
          activeOpacity={0.8}
        >
          <Text style={styles.buyNowText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingBottom: 110,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  notFoundText: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 12,
  },
  backBtn: {
    marginTop: 16,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  heroImageContainer: {
    width: '100%',
    height: 320,
    backgroundColor: '#F8FAFC',
    position: 'relative',
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  discountBadge: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    backgroundColor: Colors.danger,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: BorderRadius.sm,
  },
  discountBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  thumbnailRow: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: '#FFFFFF',
  },
  thumbnailWrapper: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginRight: 10,
  },
  thumbnailActive: {
    borderColor: Colors.primary,
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
  },
  detailsContainer: {
    padding: Spacing.md,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  brandText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#15803D',
    marginRight: 5,
  },
  stockText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#15803D',
  },
  productTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.light.text,
    lineHeight: 28,
    marginBottom: 8,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  ratingNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginLeft: 6,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: Spacing.md,
  },
  currentPrice: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
  },
  oldPrice: {
    fontSize: 18,
    color: Colors.light.textMuted,
    textDecorationLine: 'line-through',
    marginLeft: 10,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: Spacing.md,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.light.textSecondary,
    marginBottom: Spacing.lg,
  },
  specsSection: {
    marginBottom: Spacing.lg,
  },
  specsTable: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specRow: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  specRowEven: {
    backgroundColor: '#F8FAFC',
  },
  specRowOdd: {
    backgroundColor: '#FFFFFF',
  },
  specKey: {
    width: '45%',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  specValue: {
    width: '55%',
    fontSize: 13,
    color: Colors.light.text,
  },
  quantitySection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  quantityPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  quantityBtn: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  quantityValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: 16,
  },
  toastContainer: {
    position: 'absolute',
    top: 20,
    alignSelf: 'center',
    backgroundColor: '#1E293B',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.full,
    zIndex: 99,
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 8,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  addToCartBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primaryLight,
    height: 50,
    borderRadius: BorderRadius.full,
    marginRight: 10,
  },
  addToCartText: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: '700',
    marginLeft: 6,
  },
  buyNowBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    height: 50,
    borderRadius: BorderRadius.full,
  },
  buyNowText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

