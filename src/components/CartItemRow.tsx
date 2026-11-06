import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { CartItem } from '../types';
import { Colors, BorderRadius, Spacing } from '../constants/theme';
import { useCart } from '../context/CartContext';

interface CartItemRowProps {
  item: CartItem;
}

export const CartItemRow: React.FC<CartItemRowProps> = ({ item }) => {
  const { updateQuantity, removeFromCart } = useCart();
  const { product, quantity } = item;

  return (
    <View style={styles.container}>
      <Image source={{ uri: product.imageUrl }} style={styles.image} resizeMode="cover" />

      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={styles.brand}>{product.brand}</Text>
          <TouchableOpacity
            onPress={() => removeFromCart(product.id)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="trash-outline" size={18} color={Colors.danger} />
          </TouchableOpacity>
        </View>

        <Text style={styles.title} numberOfLines={1}>
          {product.title}
        </Text>

        <View style={styles.bottomRow}>
          <Text style={styles.price}>${(product.price * quantity).toFixed(2)}</Text>

          <View style={styles.stepper}>
            <TouchableOpacity
              onPress={() => updateQuantity(product.id, quantity - 1)}
              style={styles.stepperBtn}
              activeOpacity={0.7}
            >
              <Ionicons name={quantity === 1 ? 'trash-outline' : 'remove'} size={14} color={quantity === 1 ? Colors.danger : Colors.light.text} />
            </TouchableOpacity>

            <Text style={styles.quantityText}>{quantity}</Text>

            <TouchableOpacity
              onPress={() => updateQuantity(product.id, quantity + 1)}
              style={styles.stepperBtn}
              disabled={quantity >= product.stock}
              activeOpacity={0.7}
            >
              <Ionicons
                name="add"
                size={14}
                color={quantity >= product.stock ? Colors.light.textMuted : Colors.light.text}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  image: {
    width: 80,
    height: 80,
    borderRadius: BorderRadius.md,
    backgroundColor: '#F8FAFC',
  },
  content: {
    flex: 1,
    marginLeft: Spacing.md,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brand: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    marginVertical: 4,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  price: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.primary,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.full,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  stepperBtn: {
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  quantityText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.text,
    paddingHorizontal: 10,
  },
});
