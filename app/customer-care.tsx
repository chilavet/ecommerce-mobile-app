import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Linking,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Colors, Spacing, BorderRadius, Shadows } from '../src/constants/theme';
import { useAuth } from '../src/context/AuthContext';
import { createSupportTicket, getSupportTickets, getOrders } from '../src/database/db';
import { SupportTicket, Order } from '../src/types';

// Hotlines and support channels
const CUSTOMER_CARE_PHONE = '+2348007467785';
const CUSTOMER_CARE_PHONE_DISPLAY = '+234 800 746 7785';
const WHATSAPP_PHONE = '2348031234567';
const SUPPORT_EMAIL = 'support@shoppulse.ng';

// Pre-defined Nigerian FAQs
interface FAQItem {
  id: string;
  category: 'Orders' | 'Payments' | 'Wallet' | 'Delivery' | 'Returns';
  question: string;
  answer: string;
}

const FAQS_DATA: FAQItem[] = [
  {
    id: 'faq_1',
    category: 'Orders',
    question: 'How do I track my order delivery in Nigeria?',
    answer:
      'Go to the Orders tab in the app. Each order has a live milestone tracker showing: Placed ➔ Processing (Lagos Hub) ➔ Shipped (In transit with SpeedAF / GIG Logistics) ➔ Delivered, along with your Nigerian courier tracking ID.',
  },
  {
    id: 'faq_2',
    category: 'Delivery',
    question: 'What are the delivery timelines and coverage areas?',
    answer:
      'We deliver nationwide across all 36 states and the FCT:\n• Lagos State: Same-day or next-day delivery.\n• Abuja & Port Harcourt: 1-2 business days.\n• Other Nigerian States: 2-4 business days.\nDeliveries are handled by verified dispatch partners including SpeedAF and GIG Logistics.',
  },
  {
    id: 'faq_3',
    category: 'Payments',
    question: 'What payment methods do you accept?',
    answer:
      'We support direct Nigerian Debit & Credit Cards (Mastercard, Visa, and Verve) processed securely through the Paystack Payment Gateway, as well as your ShopPulse Digital Wallet balance in Naira (₦).',
  },
  {
    id: 'faq_4',
    category: 'Wallet',
    question: 'How does the ShopPulse Digital Wallet work?',
    answer:
      'Your digital wallet lets you store Naira funds for instant 1-tap checkout. You can fund your wallet using Paystack via card or bank transfer. Wallet transactions have zero processing fees.',
  },
  {
    id: 'faq_5',
    category: 'Returns',
    question: 'What is your return policy for damaged or wrong items?',
    answer:
      'If you receive a defective, missing, or mismatched item, notify us within 48 hours of delivery using the "Submit Complaint" form on this page with a photo of the item. We will arrange a free courier pickup and issue an instant refund to your wallet.',
  },
  {
    id: 'faq_6',
    category: 'Orders',
    question: 'Can I cancel an order after placing it?',
    answer:
      'Orders can be cancelled while in the "Placed" stage before packing begins at our Lagos fulfillment hub. Once your order enters "Processing" or "Shipped", please await delivery and initiate a standard return.',
  },
  {
    id: 'faq_7',
    category: 'Payments',
    question: 'Are my Paystack card details secure?',
    answer:
      'Yes, 100% secure. ShopPulse does not store your card details or CVV. All card payments are processed using Paystack\'s tokenized PCI-DSS Level 1 certified gateway with 256-bit bank-grade encryption and 3D Secure OTP authentication.',
  },
  {
    id: 'faq_8',
    category: 'Wallet',
    question: 'How do order refunds to my wallet work?',
    answer:
      'When an order is cancelled or a return is approved, funds are credited directly to your ShopPulse Wallet within 5 to 10 minutes. You can reuse the balance immediately on any purchase.',
  },
];

const COMPLAINT_CATEGORIES = [
  '📦 Order & Delivery Delay',
  '💳 Payment & Paystack Charge',
  '⚠️ Damaged or Wrong Item',
  '👛 Wallet Balance Issue',
  '🔒 Account & Login Help',
  '💬 General Inquiry / Feedback',
];

export default function CustomerCareScreen() {
  const { user } = useAuth();

  // Active Screen Tab: 'complaint' | 'faqs' | 'tickets'
  const [activeTab, setActiveTab] = useState<'complaint' | 'faqs' | 'tickets'>('complaint');

  // Call hotline function
  const handleCallSupport = () => {
    const url = `tel:${CUSTOMER_CARE_PHONE}`;
    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert(
            'Customer Care Line',
            `Direct line: ${CUSTOMER_CARE_PHONE_DISPLAY}\n\nPlease dial this number on your phone. Available 24/7.`,
            [{ text: 'Copy Number', onPress: () => {} }, { text: 'OK' }]
          );
        }
      })
      .catch(() => {
        Alert.alert(
          'Customer Care Line',
          `Direct hotline: ${CUSTOMER_CARE_PHONE_DISPLAY}\n\nOur Lagos support desk is available 24/7.`
        );
      });
  };

  const handleOpenWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hello ShopPulse Nigeria Support! I need assistance with my account (${user?.email || 'Customer'}).`
    );
    const url = `https://wa.me/${WHATSAPP_PHONE}?text=${msg}`;
    Linking.openURL(url).catch(() => {
      Alert.alert('WhatsApp Support', `Reach us on WhatsApp: +${WHATSAPP_PHONE}`);
    });
  };

  const handleSendEmail = () => {
    const subject = encodeURIComponent('ShopPulse Customer Support Inquiry');
    const body = encodeURIComponent(
      `Customer Name: ${user?.name || 'Customer'}\nEmail: ${user?.email || ''}\n\nDescribe your inquiry below:\n`
    );
    Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${body}`).catch(() => {
      Alert.alert('Email Support', `Please email us at: ${SUPPORT_EMAIL}`);
    });
  };

  // --- Complaint Form State ---
  const [selectedCategory, setSelectedCategory] = useState<string>(COMPLAINT_CATEGORIES[0]);
  const [complaintText, setComplaintText] = useState<string>('');
  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [attachedMediaUri, setAttachedMediaUri] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [ticketsList, setTicketsList] = useState<SupportTicket[]>([]);

  useEffect(() => {
    loadOrdersAndTickets();
  }, [user]);

  const loadOrdersAndTickets = async () => {
    if (user?.id) {
      const orders = await getOrders(user.id);
      setRecentOrders(orders);
      if (orders.length > 0 && !selectedOrderId) {
        setSelectedOrderId(orders[0].id);
      }
      const tickets = await getSupportTickets(user.id);
      setTicketsList(tickets);
    }
  };

  // Media picker actions
  const handlePickFromGallery = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow gallery access to attach photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedMediaUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Attachment Error', 'Could not select image from gallery.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Please allow camera access to take a photo.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setAttachedMediaUri(result.assets[0].uri);
      }
    } catch (err) {
      Alert.alert('Camera Error', 'Could not capture photo.');
    }
  };

  const handleSubmitComplaint = async () => {
    if (!complaintText.trim() || complaintText.trim().length < 8) {
      Alert.alert('Incomplete Complaint', 'Please describe your complaint in detail (at least 8 characters).');
      return;
    }

    setSubmitting(true);
    try {
      const newTicket = await createSupportTicket({
        userId: user?.id || 'usr_demo',
        category: selectedCategory,
        orderId: selectedOrderId || undefined,
        message: complaintText.trim(),
        mediaUri: attachedMediaUri || undefined,
        status: 'under_review',
      });

      setSubmitting(false);
      setComplaintText('');
      setAttachedMediaUri(null);

      // Reload tickets
      const updated = await getSupportTickets(user?.id || 'usr_demo');
      setTicketsList(updated);

      Alert.alert(
        'Complaint Submitted ✅',
        `Ticket ID: ${newTicket.id}\n\nOur Lagos support desk has received your report. A representative will review your attachment and respond within 2 hours.`,
        [
          {
            text: 'View My Tickets',
            onPress: () => setActiveTab('tickets'),
          },
          { text: 'OK' },
        ]
      );
    } catch (error) {
      setSubmitting(false);
      Alert.alert('Submission Error', 'Failed to submit complaint. Please try again.');
    }
  };

  // --- FAQs State ---
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFaqCategory, setSelectedFaqCategory] = useState<string>('All');
  const [expandedFaqIds, setExpandedFaqIds] = useState<Record<string, boolean>>({ faq_1: true });

  const toggleFaq = (id: string) => {
    setExpandedFaqIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredFaqs = FAQS_DATA.filter((item) => {
    const matchesCategory =
      selectedFaqCategory === 'All' || item.category === selectedFaqCategory;
    const matchesQuery =
      searchQuery.trim() === '' ||
      item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.answer.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Hotline & Emergency Call Card */}
        <View style={[styles.callCard, Shadows.md]}>
          <View style={styles.callCardTop}>
            <View style={styles.callIconBg}>
              <Ionicons name="call" size={24} color="#FFFFFF" />
            </View>
            <View style={styles.callInfo}>
              <View style={styles.callBadgeRow}>
                <View style={styles.livePulseDot} />
                <Text style={styles.livePulseText}>DESK OPEN 24/7</Text>
              </View>
              <Text style={styles.callTitle}>Customer Care Hotline</Text>
              <Text style={styles.callNumber}>{CUSTOMER_CARE_PHONE_DISPLAY}</Text>
            </View>
          </View>

          <Text style={styles.callSubtext}>
            Speak directly with a Nigerian customer care specialist regarding orders, payments, or refunds.
          </Text>

          {/* Action Buttons Row: Call, WhatsApp, Email */}
          <View style={styles.callActionsRow}>
            <TouchableOpacity
              style={styles.dialNowBtn}
              onPress={handleCallSupport}
              activeOpacity={0.8}
            >
              <Ionicons name="call" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.dialNowText}>Call Support</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.whatsAppBtn}
              onPress={handleOpenWhatsApp}
              activeOpacity={0.8}
            >
              <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.whatsAppText}>WhatsApp</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emailBtn}
              onPress={handleSendEmail}
              activeOpacity={0.8}
            >
              <Ionicons name="mail" size={18} color={Colors.primary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Navigation Tabs Switcher */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'complaint' && styles.tabButtonActive]}
            onPress={() => setActiveTab('complaint')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="chatbubble-ellipses"
              size={16}
              color={activeTab === 'complaint' ? Colors.primary : Colors.light.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'complaint' && styles.tabButtonTextActive,
              ]}
            >
              Submit Complaint
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'faqs' && styles.tabButtonActive]}
            onPress={() => setActiveTab('faqs')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="help-circle"
              size={16}
              color={activeTab === 'faqs' ? Colors.primary : Colors.light.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'faqs' && styles.tabButtonTextActive,
              ]}
            >
              FAQs ({FAQS_DATA.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'tickets' && styles.tabButtonActive]}
            onPress={() => setActiveTab('tickets')}
            activeOpacity={0.7}
          >
            <Ionicons
              name="time"
              size={16}
              color={activeTab === 'tickets' ? Colors.primary : Colors.light.textSecondary}
              style={{ marginRight: 6 }}
            />
            <Text
              style={[
                styles.tabButtonText,
                activeTab === 'tickets' && styles.tabButtonTextActive,
              ]}
            >
              My Tickets ({ticketsList.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* TAB 1: SUBMIT COMPLAINT FORM */}
        {activeTab === 'complaint' && (
          <View style={[styles.sectionCard, Shadows.sm]}>
            <View style={styles.formHeader}>
              <Ionicons name="create-outline" size={20} color={Colors.primary} />
              <Text style={styles.formSectionTitle}>Lodge a Formal Complaint</Text>
            </View>
            <Text style={styles.formSectionSubtitle}>
              Type your grievance below and attach media proof (photo/receipt). Our team will investigate immediately.
            </Text>

            {/* Select Issue Category */}
            <Text style={styles.inputLabel}>ISSUE CATEGORY</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryScroll}
            >
              {COMPLAINT_CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                    onPress={() => setSelectedCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Related Order (Optional) */}
            {recentOrders.length > 0 && (
              <View style={styles.formGroup}>
                <Text style={styles.inputLabel}>LINK RECENT ORDER (OPTIONAL)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 4 }}>
                  {recentOrders.map((ord) => {
                    const isSelected = selectedOrderId === ord.id;
                    return (
                      <TouchableOpacity
                        key={ord.id}
                        style={[
                          styles.orderChip,
                          isSelected && styles.orderChipSelected,
                        ]}
                        onPress={() => setSelectedOrderId(isSelected ? '' : ord.id)}
                      >
                        <Ionicons
                          name={isSelected ? 'checkmark-circle' : 'receipt-outline'}
                          size={14}
                          color={isSelected ? Colors.primary : Colors.light.textSecondary}
                        />
                        <Text
                          style={[
                            styles.orderChipText,
                            isSelected && styles.orderChipTextSelected,
                          ]}
                        >
                          Order #{ord.id.replace('ord_', '')} (₦{ord.total.toLocaleString()})
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              </View>
            )}

            {/* Complaint Text Box */}
            <View style={styles.formGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.inputLabel}>EXPLAIN YOUR COMPLAINT</Text>
                <Text style={styles.charCount}>{complaintText.length}/500</Text>
              </View>
              <TextInput
                style={styles.textAreaInput}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
                placeholder="Type full details of your complaint here (e.g. order item mismatch, unexpected delay, payment deduction, or request for refund)..."
                placeholderTextColor={Colors.light.textMuted}
                value={complaintText}
                onChangeText={(text) => setComplaintText(text.slice(0, 500))}
              />
            </View>

            {/* Media Attachment Box */}
            <View style={styles.formGroup}>
              <Text style={styles.inputLabel}>ATTACH MEDIA (PHOTO / SCREENSHOT)</Text>

              {attachedMediaUri ? (
                <View style={styles.mediaPreviewContainer}>
                  <Image source={{ uri: attachedMediaUri }} style={styles.previewImage} />
                  <View style={styles.mediaOverlayInfo}>
                    <View style={styles.mediaTag}>
                      <Ionicons name="image" size={14} color="#FFFFFF" />
                      <Text style={styles.mediaTagText}>Media Attached</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.removeMediaBtn}
                      onPress={() => setAttachedMediaUri(null)}
                      activeOpacity={0.8}
                    >
                      <Ionicons name="trash" size={16} color="#FFFFFF" />
                      <Text style={styles.removeMediaText}>Remove</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View style={styles.attachBox}>
                  <View style={styles.attachBoxIconRow}>
                    <View style={styles.attachIconCircle}>
                      <Ionicons name="camera" size={20} color={Colors.primary} />
                    </View>
                    <View style={[styles.attachIconCircle, { backgroundColor: '#F0FDF4' }]}>
                      <Ionicons name="images" size={20} color="#16A34A" />
                    </View>
                  </View>
                  <Text style={styles.attachBoxTitle}>Add Supporting Media Proof</Text>
                  <Text style={styles.attachBoxSubtitle}>
                    Upload photo of damaged parcel, wrong item, or Paystack debit alert receipt.
                  </Text>

                  <View style={styles.attachBtnsRow}>
                    <TouchableOpacity
                      style={styles.takePhotoBtn}
                      onPress={handleTakePhoto}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="camera-outline" size={16} color={Colors.primary} />
                      <Text style={styles.takePhotoText}>Take Photo</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.galleryBtn}
                      onPress={handlePickFromGallery}
                      activeOpacity={0.7}
                    >
                      <Ionicons name="images-outline" size={16} color={Colors.primary} />
                      <Text style={styles.galleryText}>Choose Gallery</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                (!complaintText.trim() || submitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmitComplaint}
              disabled={!complaintText.trim() || submitting}
              activeOpacity={0.8}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Text style={styles.submitBtnText}>Submit Complaint</Text>
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* TAB 2: FREQUENTLY ASKED QUESTIONS */}
        {activeTab === 'faqs' && (
          <View style={styles.faqsSection}>
            {/* Search Box */}
            <View style={styles.faqSearchRow}>
              <Ionicons name="search" size={18} color={Colors.light.textMuted} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.faqSearchInput}
                placeholder="Search FAQs (e.g. delivery, Paystack, refund)..."
                placeholderTextColor={Colors.light.textMuted}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')}>
                  <Ionicons name="close-circle" size={18} color={Colors.light.textMuted} />
                </TouchableOpacity>
              )}
            </View>

            {/* Category Filter Chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.faqFilterChips}
            >
              {['All', 'Orders', 'Payments', 'Wallet', 'Delivery', 'Returns'].map((cat) => {
                const isSelected = selectedFaqCategory === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    style={[
                      styles.faqFilterChip,
                      isSelected && styles.faqFilterChipActive,
                    ]}
                    onPress={() => setSelectedFaqCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.faqFilterChipText,
                        isSelected && styles.faqFilterChipTextActive,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* FAQs Accordion List */}
            {filteredFaqs.length === 0 ? (
              <View style={styles.emptyFaq}>
                <Ionicons name="search-outline" size={40} color={Colors.light.textMuted} />
                <Text style={styles.emptyFaqText}>No questions match your query.</Text>
                <TouchableOpacity
                  style={styles.resetSearchBtn}
                  onPress={() => {
                    setSearchQuery('');
                    setSelectedFaqCategory('All');
                  }}
                >
                  <Text style={styles.resetSearchText}>Clear Search</Text>
                </TouchableOpacity>
              </View>
            ) : (
              filteredFaqs.map((faq) => {
                const isExpanded = !!expandedFaqIds[faq.id];
                return (
                  <View key={faq.id} style={[styles.faqCard, Shadows.sm]}>
                    <TouchableOpacity
                      style={styles.faqHeader}
                      onPress={() => toggleFaq(faq.id)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.faqQuestionRow}>
                        <View style={styles.faqCategoryPill}>
                          <Text style={styles.faqCategoryPillText}>{faq.category}</Text>
                        </View>
                        <Text style={styles.faqQuestionText}>{faq.question}</Text>
                      </View>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color={Colors.primary}
                      />
                    </TouchableOpacity>

                    {isExpanded && (
                      <View style={styles.faqAnswerBody}>
                        <Text style={styles.faqAnswerText}>{faq.answer}</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}

        {/* TAB 3: MY SUBMITTED TICKETS */}
        {activeTab === 'tickets' && (
          <View style={styles.ticketsSection}>
            <View style={styles.ticketsHeaderRow}>
              <Text style={styles.ticketsSectionTitle}>Your Support Tickets</Text>
              <Text style={styles.ticketsCount}>{ticketsList.length} Total</Text>
            </View>

            {ticketsList.length === 0 ? (
              <View style={styles.emptyTicketsCard}>
                <Ionicons name="receipt-outline" size={44} color={Colors.light.textMuted} />
                <Text style={styles.emptyTicketsTitle}>No Complaints Lodged</Text>
                <Text style={styles.emptyTicketsSubtitle}>
                  You have not submitted any complaints or inquiries yet.
                </Text>
                <TouchableOpacity
                  style={styles.createTicketBtn}
                  onPress={() => setActiveTab('complaint')}
                >
                  <Text style={styles.createTicketBtnText}>Lodge a Complaint</Text>
                </TouchableOpacity>
              </View>
            ) : (
              ticketsList.map((ticket) => {
                const isResolved = ticket.status === 'resolved';
                return (
                  <View key={ticket.id} style={[styles.ticketCard, Shadows.sm]}>
                    <View style={styles.ticketCardHeader}>
                      <View>
                        <Text style={styles.ticketId}>{ticket.id}</Text>
                        <Text style={styles.ticketDate}>
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.ticketStatusBadge,
                          isResolved ? styles.badgeResolved : styles.badgeReview,
                        ]}
                      >
                        <Ionicons
                          name={isResolved ? 'checkmark-circle' : 'time'}
                          size={12}
                          color={isResolved ? '#15803D' : '#D97706'}
                          style={{ marginRight: 4 }}
                        />
                        <Text
                          style={[
                            styles.ticketStatusText,
                            isResolved ? styles.textResolved : styles.textReview,
                          ]}
                        >
                          {isResolved ? 'RESOLVED' : 'UNDER REVIEW'}
                        </Text>
                      </View>
                    </View>

                    <View style={styles.ticketCategoryBadge}>
                      <Text style={styles.ticketCategoryText}>{ticket.category}</Text>
                      {ticket.orderId && (
                        <Text style={styles.ticketOrderText}>• Order #{ticket.orderId.replace('ord_', '')}</Text>
                      )}
                    </View>

                    <Text style={styles.ticketMessage}>{ticket.message}</Text>

                    {ticket.mediaUri && (
                      <View style={styles.ticketMediaBox}>
                        <Image source={{ uri: ticket.mediaUri }} style={styles.ticketMediaThumb} />
                        <Text style={styles.ticketMediaNote}>Media Proof Attached</Text>
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    gap: 16,
  },
  // Hotline Card
  callCard: {
    backgroundColor: '#0F172A',
    borderRadius: BorderRadius.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: '#334155',
  },
  callCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  callIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  callInfo: {
    flex: 1,
  },
  callBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 6,
  },
  livePulseText: {
    color: '#86EFAC',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  callTitle: {
    color: '#94A3B8',
    fontSize: 12,
    fontWeight: '600',
  },
  callNumber: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  callSubtext: {
    color: '#CBD5E1',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  callActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dialNowBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16A34A',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  dialNowText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  whatsAppBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#25D366',
    paddingVertical: 12,
    borderRadius: BorderRadius.md,
  },
  whatsAppText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  emailBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Tabs Switcher
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: BorderRadius.lg,
    padding: 4,
  },
  tabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  tabButtonActive: {
    backgroundColor: '#FFFFFF',
    ...Shadows.sm,
  },
  tabButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  tabButtonTextActive: {
    fontWeight: '800',
    color: Colors.primary,
  },

  // Form Section
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  formHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  formSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  formSectionSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 16,
    lineHeight: 18,
  },
  formGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  charCount: {
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  categoryScroll: {
    gap: 8,
    paddingBottom: 4,
  },
  categoryChip: {
    backgroundColor: Colors.light.inputBg,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  categoryChipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  categoryChipTextSelected: {
    color: Colors.primary,
    fontWeight: '800',
  },
  orderChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.inputBg,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginRight: 8,
  },
  orderChipSelected: {
    backgroundColor: '#EFF6FF',
    borderColor: Colors.primary,
  },
  orderChipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  orderChipTextSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  textAreaInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.lg,
    padding: 12,
    fontSize: 14,
    color: Colors.light.text,
    minHeight: 110,
  },

  // Media Attachment Box
  attachBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#93C5FD',
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.lg,
    padding: 16,
    alignItems: 'center',
  },
  attachBoxIconRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 8,
  },
  attachIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attachBoxTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    marginBottom: 2,
  },
  attachBoxSubtitle: {
    fontSize: 11,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 16,
    paddingHorizontal: 10,
  },
  attachBtnsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  takePhotoBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  takePhotoText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  galleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: Colors.light.border,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
  },
  galleryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.text,
  },
  mediaPreviewContainer: {
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: 180,
    backgroundColor: '#E2E8F0',
  },
  mediaOverlayInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  mediaTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mediaTagText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  removeMediaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#DC2626',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  removeMediaText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.lg,
    marginTop: 6,
  },
  submitBtnDisabled: {
    backgroundColor: Colors.light.textMuted,
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },

  // FAQs Tab
  faqsSection: {
    gap: 12,
  },
  faqSearchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.lg,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqSearchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.text,
  },
  faqFilterChips: {
    gap: 8,
    paddingVertical: 2,
  },
  faqFilterChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  faqFilterChipText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  faqFilterChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  emptyFaq: {
    alignItems: 'center',
    padding: 30,
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
  },
  emptyFaqText: {
    marginTop: 8,
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  resetSearchBtn: {
    marginTop: 12,
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
  },
  resetSearchText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '700',
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  faqQuestionRow: {
    flex: 1,
    marginRight: 12,
  },
  faqCategoryPill: {
    alignSelf: 'flex-start',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: BorderRadius.sm,
    marginBottom: 4,
  },
  faqCategoryPillText: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.light.textMuted,
    textTransform: 'uppercase',
  },
  faqQuestionText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 20,
  },
  faqAnswerBody: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  faqAnswerText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },

  // Tickets Tab
  ticketsSection: {
    gap: 12,
  },
  ticketsHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  ticketsSectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.text,
  },
  ticketsCount: {
    fontSize: 12,
    color: Colors.light.textMuted,
    fontWeight: '700',
  },
  emptyTicketsCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 30,
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  emptyTicketsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.text,
    marginTop: 10,
  },
  emptyTicketsSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  createTicketBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
  },
  createTicketBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  ticketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: BorderRadius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ticketCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.text,
  },
  ticketDate: {
    fontSize: 11,
    color: Colors.light.textMuted,
    marginTop: 2,
  },
  ticketStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  badgeResolved: {
    backgroundColor: '#DCFCE7',
  },
  badgeReview: {
    backgroundColor: '#FEF3C7',
  },
  ticketStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  textResolved: {
    color: '#15803D',
  },
  textReview: {
    color: '#D97706',
  },
  ticketCategoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 8,
  },
  ticketCategoryText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
  ticketOrderText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  ticketMessage: {
    fontSize: 13,
    color: Colors.light.text,
    lineHeight: 19,
  },
  ticketMediaBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F8FAFC',
    borderRadius: BorderRadius.md,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  ticketMediaThumb: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.sm,
    backgroundColor: '#E2E8F0',
  },
  ticketMediaNote: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
});

