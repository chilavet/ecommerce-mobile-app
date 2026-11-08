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
import { useLocation } from '@/src/context/LocationContext';
import { useTheme } from '@/src/context/ThemeContext';
import { openGoogleMaps, openGoogleMapsDirections, getDeliveryEstimate } from '@/src/utils/location';
import { formatNaira } from '@/src/utils/currency';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, isDark } = useTheme();
  const { addToCart } = useCart();
  const { currentLocation, enrichProductWithDistance } = useLocation();

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
          const enriched = enrichProductWithDistance(prod);
          setProduct(enriched);
          setSelectedImage(enriched.imageUrl);
        }
      } catch (err) {
        console.error('Error fetching product:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id, currentLocation]);

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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Stack.Screen
        options={{
          title: product.brand,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push('/(tabs)/cart')} style={{ marginRight: 8 }}>
              <Ionicons name="cart-outline" size={24} color={colors.text} />
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
                  { borderColor: colors.border },
                  selectedImage === img && styles.thumbnailActive,
                ]}
              >
                <Image source={{ uri: img }} style={styles.thumbnailImg} resizeMode="cover" />
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Details Container */}
        <View style={[styles.detailsContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
          {/* Brand & Stock */}
          <View style={styles.topRow}>
            <Text style={styles.brandText}>{product.brand}</Text>
            <View style={styles.stockBadge}>
              <View style={styles.stockDot} />
              <Text style={styles.stockText}>{product.stock > 0 ? 'In Stock' : 'Out of Stock'}</Text>
            </View>
          </View>

          {/* Title */}
          <Text style={[styles.productTitle, { color: colors.text }]}>{product.title}</Text>

          {/* Rating */}
          <View style={styles.ratingRow}>
            <Ionicons name="star" size={16} color={Colors.accent} />
            <Text style={[styles.ratingNumber, { color: colors.text }]}>{product.rating.toFixed(1)}</Text>
            <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>({product.reviewsCount} verified reviews)</Text>
          </View>

          {/* Price Box */}
          <View style={styles.priceContainer}>
            <Text style={styles.currentPrice}>{formatNaira(product.price)}</Text>
            {product.originalPrice && (
              <Text style={[styles.oldPrice, { color: colors.textMuted }]}>{formatNaira(product.originalPrice)}</Text>
            )}
          </View>

          <View style={[styles.divider, { backgroundColor: colors.divider }]} />

          {/* Description */}
          <Text style={[styles.sectionHeader, { color: colors.text }]}>Overview</Text>
          <Text style={[styles.descriptionText, { color: colors.textSecondary }]}>{product.description}</Text>

          {/* Store Location & Google Maps Connection */}
          {product.location && (
            <View style={styles.locationSection}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Store &amp; Warehouse Location</Text>
              <View style={[styles.locationCard, { backgroundColor: colors.subCard, borderColor: colors.border }, Shadows.sm]}>
                <View style={styles.locationCardHeader}>
                  <View style={[styles.storeIconCircle, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
                    <Ionicons name="storefront" size={20} color={Colors.primary} />
                  </View>
                  <View style={styles.storeHeaderInfo}>
                    <Text style={[styles.storeName, { color: colors.text }]}>{product.location.name}</Text>
                    <Text style={[styles.storeAddress, { color: colors.textSecondary }]}>
                      {product.location.address}, {product.location.city}, {product.location.state} {product.location.postalCode}
                    </Text>
                  </View>
                </View>

                {/* Distance Badge & Delivery Speed */}
                <View style={styles.distanceInfoRow}>
                  <View style={[styles.distancePill, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF' }]}>
                    <Ionicons name="location-sharp" size={14} color={Colors.primary} />
                    <Text style={styles.distancePillText}>
                      {product.distanceMiles !== undefined
                        ? `${product.distanceMiles.toFixed(1)} miles from your location`
                        : 'Nearby store'}
                    </Text>
                  </View>
                  {product.distanceMiles !== undefined && (
                    <View style={styles.deliveryBadge}>
                      <Ionicons
                        name="flash"
                        size={12}
                        color={getDeliveryEstimate(product.distanceMiles).color}
                      />
                      <Text
                        style={[
                          styles.deliveryBadgeText,
                          { color: getDeliveryEstimate(product.distanceMiles).color },
                        ]}
                      >
                        {getDeliveryEstimate(product.distanceMiles).badge} ({getDeliveryEstimate(product.distanceMiles).time})
                      </Text>
                    </View>
                  )}
                </View>

                {/* Google Maps Actions */}
                <View style={styles.mapButtonsRow}>
                  <TouchableOpacity
                    style={styles.googleMapsBtn}
                    onPress={() =>
                      openGoogleMaps(
                        product.location!.latitude,
                        product.location!.longitude,
                        product.location!.name
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons name="map" size={16} color="#FFFFFF" />
                    <Text style={styles.googleMapsBtnText}>Open in Google Maps</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.directionsBtn, { backgroundColor: isDark ? '#1E293B' : '#FFFFFF', borderColor: isDark ? '#334155' : '#E2E8F0' }]}
                    onPress={() =>
                      openGoogleMapsDirections(
                        product.location!.latitude,
                        product.location!.longitude,
                        `${product.location!.address}, ${product.location!.city}`
                      )
                    }
                    activeOpacity={0.8}
                  >
                    <Ionicons name="navigate-outline" size={16} color={Colors.primary} />
                    <Text style={styles.directionsBtnText}>Directions</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}

          {/* Quantity Selector */}
          <View style={styles.quantitySection}>
            <Text style={[styles.sectionHeader, { color: colors.text }]}>Quantity</Text>
            <View style={[styles.quantityPicker, { backgroundColor: colors.subCard, borderColor: colors.border }]}>
              <TouchableOpacity
                onPress={() => setQuantity(Math.max(1, quantity - 1))}
                style={styles.quantityBtn}
              >
                <Ionicons name="remove" size={18} color={colors.text} />
              </TouchableOpacity>
              <Text style={[styles.quantityValue, { color: colors.text }]}>{quantity}</Text>
              <TouchableOpacity
                onPress={() => setQuantity(Math.min(product.stock, quantity + 1))}
                style={styles.quantityBtn}
              >
                <Ionicons name="add" size={18} color={colors.text} />
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
      <View style={[styles.bottomBar, { backgroundColor: colors.card, borderTopColor: colors.border }, Shadows.lg]}>
        <TouchableOpacity
          style={[styles.addToCartBtn, { backgroundColor: isDark ? '#1E293B' : '#EFF6FF', borderColor: Colors.primary }]}
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
  locationSection: {
    marginBottom: Spacing.lg,
  },
  locationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  locationCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  storeIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  storeHeaderInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
  },
  storeAddress: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  distanceInfoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  distancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  distancePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  deliveryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  deliveryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  mapButtonsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  googleMapsBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA4335',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 6,
  },
  googleMapsBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  directionsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    gap: 4,
  },
  directionsBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
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

