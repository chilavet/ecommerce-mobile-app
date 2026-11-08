import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { useTheme } from '../src/context/ThemeContext';

export default function AboutScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'about' | 'terms' | 'privacy'>('about');

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Segmented Top Tabs */}
      <View style={[styles.tabBarWrapper, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={[styles.tabBar, { backgroundColor: colors.subCard }]}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'about' && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('about')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="information-circle"
              size={16}
              color={activeTab === 'about' ? Colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: colors.textSecondary },
                activeTab === 'about' && styles.tabBtnTextActive,
              ]}
            >
              About App
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'terms' && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('terms')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="document-text"
              size={16}
              color={activeTab === 'terms' ? Colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: colors.textSecondary },
                activeTab === 'terms' && styles.tabBtnTextActive,
              ]}
            >
              Terms of Service
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'privacy' && [styles.tabBtnActive, { backgroundColor: colors.card }]]}
            onPress={() => setActiveTab('privacy')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="shield-checkmark"
              size={16}
              color={activeTab === 'privacy' ? Colors.primary : colors.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabBtnText,
                { color: colors.textSecondary },
                activeTab === 'privacy' && styles.tabBtnTextActive,
              ]}
            >
              Privacy Policy
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ==================== TAB 1: ABOUT APP ==================== */}
        {activeTab === 'about' && (
          <View style={styles.tabContent}>
            {/* Brand Header Card */}
            <View style={[styles.brandCard, Shadows.md]}>
              <View style={styles.logoCircle}>
                <Ionicons name="storefront" size={36} color="#FFFFFF" />
              </View>
              <Text style={styles.brandTitle}>ShopPulse</Text>
              <View style={styles.nigeriaPill}>
                <Text style={styles.nigeriaPillText}>🇳🇬 Nigeria's E-Commerce Hub</Text>
              </View>
              <Text style={styles.brandSubtitle}>
                The next-generation mobile shopping experience built specifically for Nigerian consumers, featuring instant card payments, digital wallet checkout, and verified nationwide logistics.
              </Text>
              <View style={styles.buildBadge}>
                <Text style={styles.buildBadgeText}>Version 1.0.0 • Build 42 (Release 2026.11)</Text>
              </View>
            </View>

            {/* Core Pillars */}
            <Text style={styles.sectionHeader}>WHY SHOPPULSE NIGERIA</Text>
            <View style={styles.featuresGrid}>
              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#EFF6FF' }]}>
                  <Ionicons name="cash" size={20} color={Colors.primary} />
                </View>
                <Text style={styles.featureTitle}>100% Naira Pricing (₦)</Text>
                <Text style={styles.featureDesc}>
                  Zero foreign exchange volatility or hidden bank FX charges. All products are priced transparently in Naira.
                </Text>
              </View>

              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#F0FDF4' }]}>
                  <Ionicons name="card" size={20} color="#16A34A" />
                </View>
                <Text style={styles.featureTitle}>Secure Card Payments</Text>
                <Text style={styles.featureDesc}>
                  PCI-DSS Level 1 certified gateway accepting Nigerian Mastercard, Visa, and Verve cards with 3D Secure OTP.
                </Text>
              </View>

              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#FAF5FF' }]}>
                  <Ionicons name="wallet" size={20} color="#9333EA" />
                </View>
                <Text style={styles.featureTitle}>ShopPulse Wallet</Text>
                <Text style={styles.featureDesc}>
                  In-app digital wallet for instantaneous 1-tap checkout, fee-free top-ups, and instant order return refunds.
                </Text>
              </View>

              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#FFFBEB' }]}>
                  <Ionicons name="airplane" size={20} color="#D97706" />
                </View>
                <Text style={styles.featureTitle}>Nationwide Delivery</Text>
                <Text style={styles.featureDesc}>
                  SpeedAF and GIG Logistics fulfillment networks covering Lagos, Abuja, Port Harcourt, and all 36 states.
                </Text>
              </View>

              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#ECFDF5' }]}>
                  <Ionicons name="map" size={20} color="#059669" />
                </View>
                <Text style={styles.featureTitle}>Smart Geolocation</Text>
                <Text style={styles.featureDesc}>
                  GPS auto-routing connected to local inventory hubs, displaying items and delivery estimates according to distance.
                </Text>
              </View>

              <View style={[styles.featureCard, Shadows.sm]}>
                <View style={[styles.featureIconCircle, { backgroundColor: '#FEF2F2' }]}>
                  <Ionicons name="shield-checkmark" size={20} color="#DC2626" />
                </View>
                <Text style={styles.featureTitle}>Account Protection</Text>
                <Text style={styles.featureDesc}>
                  Encrypted passwords, secure tokenized sessions, and 256-bit bank-grade SSL safeguarding account data.
                </Text>
              </View>
            </View>

            {/* Support CTA */}
            <View style={[styles.helpCard, Shadows.sm]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.helpTitle}>Need help or have questions?</Text>
                <Text style={styles.helpDesc}>
                  Our Lagos customer care desk is open 24/7 with phone dialer, WhatsApp, and complaint tracking.
                </Text>
              </View>
              <TouchableOpacity
                style={styles.helpBtn}
                onPress={() => router.push('/customer-care')}
                activeOpacity={0.8}
              >
                <Text style={styles.helpBtnText}>Support</Text>
                <Ionicons name="arrow-forward" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
              </TouchableOpacity>
            </View>

            {/* Copyright Footer */}
            <Text style={styles.copyrightText}>
              © 2026 ShopPulse Technologies Ltd. All rights reserved.
            </Text>
          </View>
        )}

        {/* ==================== TAB 2: TERMS OF SERVICE ==================== */}
        {activeTab === 'terms' && (
          <View style={styles.tabContent}>
            <View style={styles.legalHeaderBox}>
              <Text style={styles.legalTitle}>Terms of Service</Text>
              <Text style={styles.legalMeta}>Last Updated: November 2026 • Effective Immediately</Text>
              <Text style={styles.legalLead}>
                Please read these Terms of Service carefully before utilizing the ShopPulse mobile application. By accessing or using our platform, you confirm your agreement to be legally bound by these terms.
              </Text>
            </View>

            {/* Section 1 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 1</Text>
              <Text style={styles.clauseTitle}>Eligibility &amp; Account Security</Text>
              <Text style={styles.clauseBody}>
                You must be at least 18 years of age or possess legal parental/guardian authorization to register an account with ShopPulse. You are responsible for safeguarding your credentials and passwords. Any activity conducted under your authenticated session shall be deemed authorized by you.
              </Text>
            </View>

            {/* Section 2 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 2</Text>
              <Text style={styles.clauseTitle}>Currency, Pricing &amp; Taxes</Text>
              <Text style={styles.clauseBody}>
                All product prices, delivery charges, and wallet transactions are denominated in Nigerian Naira (₦). Prices listed include all applicable statutory value-added taxes (VAT) in Nigeria. While we endeavor to ensure 100% price accuracy, ShopPulse reserves the right to correct pricing errors and cancel orders resulting from inadvertent typographical errors prior to dispatch.
              </Text>
            </View>

            {/* Section 3 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 3</Text>
              <Text style={styles.clauseTitle}>Payment Methods &amp; Card Processing</Text>
              <Text style={styles.clauseBody}>
                We accept payments via debit and credit cards (Mastercard, Visa, Verve) and the ShopPulse Digital Wallet. All card transactions undergo automated tokenization and bank OTP verification. ShopPulse does not store credit or debit card CVV numbers. Fraudulent payment attempts will be reported to Nigerian law enforcement authorities.
              </Text>
            </View>

            {/* Section 4 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 4</Text>
              <Text style={styles.clauseTitle}>Order Processing &amp; Milestone Tracking</Text>
              <Text style={styles.clauseBody}>
                Orders transition through four sequential milestones: Placed ➔ Processing ➔ Shipped ➔ Delivered. An order is deemed confirmed once payment authorization is received. Orders in the "Placed" stage may be cancelled directly; orders in "Processing" or "Shipped" have already entered logistics handling and cannot be stopped in transit.
              </Text>
            </View>

            {/* Section 5 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 5</Text>
              <Text style={styles.clauseTitle}>Delivery &amp; Logistics Nationwide</Text>
              <Text style={styles.clauseBody}>
                Deliveries are executed by approved dispatch partners (SpeedAF and GIG Logistics). Expected transit times are 24-48 hours within Lagos and 2-4 business days for other Nigerian states. Risk of loss passes to the customer upon delivery confirmation and recipient physical signature.
              </Text>
            </View>

            {/* Section 6 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 6</Text>
              <Text style={styles.clauseTitle}>Returns, Defective Goods &amp; Refunds</Text>
              <Text style={styles.clauseBody}>
                If an item is damaged, defective, or incorrect upon delivery, you must lodge a formal complaint with attached photographic proof through the Customer Care screen within 48 hours. Upon inspection, approved refunds are credited back to your ShopPulse Wallet within 10 minutes.
              </Text>
            </View>

            {/* Section 7 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>SECTION 7</Text>
              <Text style={styles.clauseTitle}>Governing Law &amp; Dispute Resolution</Text>
              <Text style={styles.clauseBody}>
                These Terms shall be governed by and construed in accordance with the laws of the Federal Republic of Nigeria. Any disputes arising out of or in connection with these Terms shall first be submitted to mutual amicable resolution through our Customer Care team before recourse to Nigerian courts.
              </Text>
            </View>
          </View>
        )}

        {/* ==================== TAB 3: PRIVACY POLICY ==================== */}
        {activeTab === 'privacy' && (
          <View style={styles.tabContent}>
            <View style={styles.legalHeaderBox}>
              <Text style={styles.legalTitle}>Privacy Policy</Text>
              <View style={styles.ndprBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#15803D" />
                <Text style={styles.ndprBadgeText}>Compliant with Nigeria Data Protection Act (NDPA)</Text>
              </View>
              <Text style={styles.legalMeta}>Last Updated: November 2026</Text>
              <Text style={styles.legalLead}>
                ShopPulse Technologies Ltd ("ShopPulse", "we", "our") respects your privacy. This policy describes how we collect, utilize, and protect your personal data when using the ShopPulse mobile application.
              </Text>
            </View>

            {/* Privacy Section 1 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 1</Text>
              <Text style={styles.clauseTitle}>Information We Collect</Text>
              <Text style={styles.clauseBody}>
                We collect personal information necessary to deliver our e-commerce services:
                {'\n'}• Account Identification: Full name, verified email address, phone number.
                {'\n'}• Location &amp; Geolocation Data: Device GPS coordinates and selected delivery area (e.g. Ikeja, Lekki, Abuja) to calculate distance to regional hubs and dispatch couriers.
                {'\n'}• Transaction Records: Ordered items, totals in Naira, payment references, and digital wallet history.
                {'\n'}• Support Media: Photographs or screenshots voluntarily attached to customer care tickets.
              </Text>
            </View>

            {/* Privacy Section 2 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 2</Text>
              <Text style={styles.clauseTitle}>Payment Security &amp; Financial Privacy</Text>
              <Text style={styles.clauseBody}>
                ShopPulse does NOT store your credit/debit card numbers, CVV security codes, or banking PINs on any server. All payment processing is conducted via a tokenized, PCI-DSS Level 1 certified gateway. Your card credentials are encrypted with 256-bit bank-grade SSL and transmitted directly to your issuing Nigerian bank.
              </Text>
            </View>

            {/* Privacy Section 3 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 3</Text>
              <Text style={styles.clauseTitle}>How We Use Your Personal Data</Text>
              <Text style={styles.clauseBody}>
                Your data is utilized strictly for lawful business purposes:
                {'\n'}1. Fulfilling orders and delivering packages to your chosen Nigerian address.
                {'\n'}2. Sending real-time push notifications regarding order progress (Placed, Shipped, Delivered).
                {'\n'}3. Preventing fraud, identity theft, and unauthorized wallet access.
                {'\n'}4. Responding to complaints and support tickets submitted through Customer Care.
              </Text>
            </View>

            {/* Privacy Section 4 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 4</Text>
              <Text style={styles.clauseTitle}>Third-Party Disclosures</Text>
              <Text style={styles.clauseBody}>
                We do NOT sell, rent, or trade your personal information to third parties. We share limited delivery information (customer name, delivery address, and contact phone number) exclusively with our verified dispatch partners (SpeedAF and GIG Logistics) strictly for package delivery.
              </Text>
            </View>

            {/* Privacy Section 5 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 5</Text>
              <Text style={styles.clauseTitle}>Your Legal Rights &amp; Account Deletion</Text>
              <Text style={styles.clauseBody}>
                Under the Nigeria Data Protection Act (NDPA), you have the right to access your stored personal information, request corrections, or permanently delete your account. You can trigger instant account deletion directly from the "Security &amp; Password" page in the app or by contacting our Data Protection Officer.
              </Text>
            </View>

            {/* Privacy Section 6 */}
            <View style={[styles.legalCard, Shadows.sm]}>
              <Text style={styles.clauseNumber}>ARTICLE 6</Text>
              <Text style={styles.clauseTitle}>Data Protection Officer (DPO) Contact</Text>
              <Text style={styles.clauseBody}>
                For privacy inquiries or to exercise your statutory data rights, reach our Data Protection Officer at:
                {'\n'}• Email: privacy@shoppulse.ng
                {'\n'}• Address: ShopPulse Technologies Ltd, Victoria Island, Lagos State, Nigeria.
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  tabBarWrapper: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: BorderRadius.md,
  },
  tabBtnActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.primary,
    fontWeight: '800',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
  },
  tabContent: {
    gap: 16,
  },

  // Brand Card
  brandCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  logoCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  brandTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  nigeriaPill: {
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.4)',
    marginTop: 6,
    marginBottom: 12,
  },
  nigeriaPillText: {
    color: '#86EFAC',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  brandSubtitle: {
    fontSize: 13,
    color: '#CBD5E1',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 16,
    paddingHorizontal: 6,
  },
  buildBadge: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: '#475569',
  },
  buildBadgeText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '700',
  },

  sectionHeader: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.textMuted,
    letterSpacing: 0.8,
    marginTop: 6,
    marginLeft: 2,
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  featureIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  featureTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },

  // Help Card
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BFDBFE',
    gap: 12,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.primary,
    marginBottom: 2,
  },
  helpDesc: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    lineHeight: 16,
  },
  helpBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  helpBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },

  copyrightText: {
    textAlign: 'center',
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 10,
  },

  // Legal Styles (Terms & Privacy)
  legalHeaderBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: Colors.light.border,
    gap: 6,
  },
  legalTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.text,
  },
  legalMeta: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textMuted,
  },
  legalLead: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
    marginTop: 4,
  },
  ndprBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
    gap: 4,
    marginVertical: 4,
  },
  ndprBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#15803D',
  },
  legalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  clauseNumber: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  clauseTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.text,
    marginBottom: 8,
  },
  clauseBody: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 20,
  },
});

