import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Modal,
  Linking,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { BottomTabBar, TabType } from '../../components/navigation/BottomTabBar';
import { ProfileScreen } from '../profile/ProfileScreen';
import { AskAIScreen } from '../ai/AskAIScreen';
import {
  Search,
  X,
  SlidersHorizontal,
  Bell,
  User,
  Calendar,
  Sparkles,
  AlertTriangle,
  Zap,
  Droplet,
  Hammer,
  PaintBucket,
  Wind,
  Bug,
  Wrench,
  Star,
  ChevronRight,
  ShieldCheck,
  CheckCircle2,
  Clock,
  LogOut,
  MapPin,
  ArrowRight,
  ArrowLeft,
  Info,
  Layers,
  RotateCcw,
  RefreshCw,
  Droplets,
  Utensils,
  Grid,
  Package,
  Layers3,
  HardHat,
  BatteryCharging,
  Tv,
  Cpu,
  Thermometer,
  Shield,
  Wifi,
  Sun,
  Camera,
  Home as HomeIcon,
  Truck,
  Lock,
  Flame,
  Maximize,
  PhoneCall,
  Phone,
  ShieldAlert,
  PhoneForwarded,
  PhoneOutgoing,
  MessageSquare,
  Send,
  Briefcase,
  Heart,
  Activity,
} from 'lucide-react-native';
import { HOUSEHOLD_SERVICES, SERVICE_GROUPS, ServiceCategory } from '../../constants/services';
import { ServiceDetailModal } from '../../components/services/ServiceDetailModal';
import { profileService } from '../../services/profileService';
import { professionalMarketplaceService } from '../../services/professionalMarketplaceService';
import { ProfessionalProfile, ProRating, ChatMessage } from '../../types/professional';

interface EmergencyNumberItem {
  id: string;
  title: string;
  number: string;
  subtitle: string;
  category: string;
  icon: any;
  color: string;
}

const INDIA_EMERGENCY_NUMBERS: EmergencyNumberItem[] = [
  { id: '1', title: 'National Emergency Helpline', number: '112', subtitle: 'All-in-one unified emergency response across India', category: 'Police & General', icon: ShieldAlert, color: '#EF4444' },
  { id: '2', title: 'Police Control Room', number: '100', subtitle: 'Direct police assistance & crime reporting', category: 'Police', icon: Shield, color: '#3B82F6' },
  { id: '3', title: 'Fire Force Rescue', number: '101', subtitle: 'Fire outbreak, rescue & hazardous situation', category: 'Fire', icon: Flame, color: '#F97316' },
  { id: '4', title: 'Medical Ambulance Helpline', number: '108', subtitle: 'National emergency medical ambulance care', category: 'Medical', icon: Heart, color: '#10B981' },
  { id: '5', title: 'National Health Ambulance', number: '102', subtitle: 'Government maternal & health emergency transport', category: 'Medical', icon: Activity, color: '#06B6D4' },
  { id: '6', title: 'Electrical Disruption & Hazard', number: '1912', subtitle: 'Transformer spark, power failure & live wire emergency', category: 'Electrical', icon: Zap, color: '#F59E0B' },
  { id: '7', title: 'LPG Gas Leakage 24/7', number: '1906', subtitle: 'Emergency response for domestic & commercial gas leaks', category: 'Gas Safety', icon: Flame, color: '#EC4899' },
  { id: '8', title: 'Disaster Management Response', number: '1070', subtitle: 'State & national disaster mitigation helpline', category: 'Disaster', icon: AlertTriangle, color: '#8B5CF6' },
  { id: '9', title: 'FixNest 24/7 Priority Emergency Line', number: '1800-123-4567', subtitle: 'Instant dispatch of emergency electrician, plumber or locksmith', category: 'FixNest Priority', icon: Wrench, color: '#3B82F6' },
];

export const HomeScreen: React.FC = () => {
  const { user, isGuest, logout } = useAuth();
  const { notifications, unreadCount, markAllRead, clearAll, sendTargetedNotification, refreshNotifications } = useNotifications();

  const [activeTab, setActiveTab] = useState<TabType>('Home');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [notificationsVisible, setNotificationsVisible] = useState(false);
  const [selectedService, setSelectedService] = useState<ServiceCategory | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');

  // Emergency & Promo States
  const [emergencyModalVisible, setEmergencyModalVisible] = useState(false);
  const [selectedEmergency, setSelectedEmergency] = useState<EmergencyNumberItem | null>(null);
  const [confirmCallModalVisible, setConfirmCallModalVisible] = useState(false);
  const [isFirstBookingPromoActive, setIsFirstBookingPromoActive] = useState(false);

  // Real Data States
  const [nearbyPros, setNearbyPros] = useState<ProfessionalProfile[]>([]);
  const [recentBookings, setRecentBookings] = useState<any[]>([]);

  // 1. Appointment Booking Modal State
  const [bookingModalVisible, setBookingModalVisible] = useState(false);
  const [bookingPro, setBookingPro] = useState<ProfessionalProfile | null>(null);
  const [bookingServiceTitle, setBookingServiceTitle] = useState('Home Repair Service');
  const [bookingDate, setBookingDate] = useState('Today');
  const [bookingTime, setBookingTime] = useState('11:00 AM');
  const [bookingAddress, setBookingAddress] = useState('Current Saved Address');
  const [bookingNotes, setBookingNotes] = useState('');
  const [isSubmittingBooking, setIsSubmittingBooking] = useState(false);

  // 2. Direct User-Pro Chat Modal State
  const [proChatModalVisible, setProChatModalVisible] = useState(false);
  const [proChatPro, setProChatPro] = useState<ProfessionalProfile | null>(null);
  const [proChatMessages, setProChatMessages] = useState<ChatMessage[]>([]);
  const [proChatInput, setProChatInput] = useState('');

  // 3. Pro Details Modal State
  const [proDetailModalVisible, setProDetailModalVisible] = useState(false);
  const [proDetailPro, setProDetailPro] = useState<ProfessionalProfile | null>(null);
  const [proDetailRatings, setProDetailRatings] = useState<ProRating[]>([]);

  // 4. Rating Submission Modal State
  const [ratingModalVisible, setRatingModalVisible] = useState(false);
  const [ratingPro, setRatingPro] = useState<ProfessionalProfile | null>(null);
  const [ratingBookingId, setRatingBookingId] = useState<string | null>(null);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  const getServiceIcon = (iconName: string) => {
    switch (iconName) {
      case 'Zap': return Zap;
      case 'Droplet': return Droplet;
      case 'Hammer': return Hammer;
      case 'Sparkles': return Sparkles;
      case 'PaintBucket': return PaintBucket;
      case 'Wind': return Wind;
      case 'Bug': return Bug;
      case 'Wrench': return Wrench;
      case 'ShieldCheck': return ShieldCheck;
      case 'Tv': return Tv;
      case 'Cpu': return Cpu;
      case 'Thermometer': return Thermometer;
      case 'Shield': return Shield;
      case 'Wifi': return Wifi;
      case 'Sun': return Sun;
      case 'Camera': return Camera;
      case 'Home': return HomeIcon;
      case 'Truck': return Truck;
      case 'Lock': return Lock;
      case 'Flame': return Flame;
      case 'Maximize': return Maximize;
      case 'Layers': return Layers;
      case 'RotateCcw': return RotateCcw;
      case 'RefreshCw': return RefreshCw;
      case 'Droplets': return Droplets;
      case 'Utensils': return Utensils;
      case 'Grid': return Grid;
      case 'Package': return Package;
      case 'Layers3': return Layers3;
      case 'HardHat': return HardHat;
      case 'BatteryCharging': return BatteryCharging;
      default: return Wrench;
    }
  };

  const getGreeting = () => {
    const hours = new Date().getHours();
    if (hours < 12) return 'Good Morning ☀️';
    if (hours < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const homeCategoryList = HOUSEHOLD_SERVICES.slice(0, 18);

  // Chat Polling for real-time synchronization
  useEffect(() => {
    if (!proChatModalVisible || !proChatPro) return;
    const pollChats = async () => {
      const uId = user?.id || 'usr_default';
      const allReqs = await professionalMarketplaceService.getAllRequests();
      const existingReq = allReqs.find(
        (r) => (r.userId === uId || uId === 'usr_default') && r.professionalId === proChatPro.id,
      );
      const threadId = existingReq ? existingReq.id : `chat_${uId}_${proChatPro.id}`;
      const msgs = await professionalMarketplaceService.getChatsForBooking(threadId);
      setProChatMessages(msgs);
    };
    pollChats();
    const timer = setInterval(pollChats, 1500);
    return () => clearInterval(timer);
  }, [proChatModalVisible, proChatPro?.id, user?.id]);

  useEffect(() => {
    refreshNotifications();
  }, [notificationsVisible]);

  useEffect(() => {
    loadUserData();
    const syncTimer = setInterval(loadUserData, 3000);

    let channel: any = null;
    if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
      try {
        channel = new (window as any).BroadcastChannel('fixnest_global_sync');
        channel.onmessage = () => {
          loadUserData();
        };
      } catch (e) {}
    }

    return () => {
      clearInterval(syncTimer);
      if (channel) {
        try { channel.close(); } catch (e) {}
      }
    };
  }, [user?.id, activeTab]);

  const loadUserData = async () => {
    try {
      const { professionals: pros } = await professionalMarketplaceService.getNearbyProfessionals();
      setNearbyPros(pros);

      const allRequests = await professionalMarketplaceService.getAllRequests();
      const userReqs = allRequests.filter(
        (r) => !user?.id || r.userId === user?.id || r.userId === 'usr_default',
      );
      setRecentBookings(userReqs);
    } catch (err) {
      console.warn('[HomeScreen] Error loading user data:', err);
    }
  };

  // Confirm Appointment Booking
  const handleConfirmBooking = async () => {
    if (!bookingPro) return;
    setIsSubmittingBooking(true);
    try {
      const activeUserId = user?.id || 'usr_' + Date.now();
      const newReq = await professionalMarketplaceService.createBookingRequest({
        serviceId: bookingPro.services[0] || 'general',
        serviceTitle: bookingServiceTitle,
        userId: activeUserId,
        userName: user?.fullName || 'User',
        userPhone: user?.phone || '+91 98765 43210',
        userEmail: user?.email || '',
        address: bookingAddress,
        city: bookingPro.currentLocation.city,
        scheduledDate: bookingDate,
        scheduledTime: bookingTime,
        notes: bookingNotes.trim(),
        professionalId: bookingPro.id,
        professionalName: bookingPro.name,
      });

      // Deliver targeted notification to Professional account
      await sendTargetedNotification(bookingPro.id, {
        type: 'booking',
        title: 'New Booking Request 📅',
        message: `New ${bookingServiceTitle} request from ${user?.fullName || 'User'} for ${bookingDate} at ${bookingTime}.`,
        actionPayload: { bookingId: newReq.id, proId: bookingPro.id },
      });

      // Deliver targeted notification to User account
      await sendTargetedNotification(activeUserId, {
        type: 'booking',
        title: 'Booking Request Sent 📅',
        message: `Your appointment request for ${bookingServiceTitle} has been sent to ${bookingPro.name} for ${bookingDate} at ${bookingTime}. Waiting for confirmation.`,
      });

      Alert.alert(
        '✅ Booking Request Sent!',
        `Your appointment request for ${bookingServiceTitle} has been sent to ${bookingPro.name} for ${bookingDate} at ${bookingTime}.\n\nYou will receive a notification as soon as ${bookingPro.name} confirms.`,
        [{ text: 'OK', onPress: () => setBookingModalVisible(false) }],
      );

      await loadUserData();
    } catch (e) {
      Alert.alert('Error', 'Could not send booking request. Please try again.');
    } finally {
      setIsSubmittingBooking(false);
    }
  };

  // Direct Chat Handler
  const handleOpenProChat = async (pro: ProfessionalProfile) => {
    setProChatPro(pro);
    const uId = user?.id || 'usr_default';
    const allReqs = await professionalMarketplaceService.getAllRequests();
    const existingReq = allReqs.find(
      (r) => (r.userId === uId || uId === 'usr_default') && r.professionalId === pro.id,
    );
    const chatId = existingReq ? existingReq.id : `chat_${uId}_${pro.id}`;
    const msgs = await professionalMarketplaceService.getChatsForBooking(chatId);
    setProChatMessages(msgs);
    setProChatModalVisible(true);
  };

  const handleSendProChatMessage = async () => {
    if (!proChatInput.trim() || !proChatPro) return;
    const text = proChatInput.trim();
    setProChatInput('');
    const uId = user?.id || 'usr_default';
    const allReqs = await professionalMarketplaceService.getAllRequests();
    const existingReq = allReqs.find(
      (r) => (r.userId === uId || uId === 'usr_default') && r.professionalId === proChatPro.id,
    );
    const chatId = existingReq ? existingReq.id : `chat_${uId}_${proChatPro.id}`;
    await professionalMarketplaceService.sendChatMessage({
      bookingId: chatId,
      senderId: uId,
      senderType: 'user',
      senderName: user?.fullName || 'User',
      message: text,
      type: 'text',
    });
    const updated = await professionalMarketplaceService.getChatsForBooking(chatId);
    setProChatMessages(updated);
  };



  // Open Appointment Booking Modal
  const handleOpenBookingModal = (pro: ProfessionalProfile, defaultServiceTitle?: string) => {
    setBookingPro(pro);
    const svcTitle =
      defaultServiceTitle ||
      (pro.services[0] ? HOUSEHOLD_SERVICES.find((s) => s.id === pro.services[0])?.title : null) ||
      'Home Repair Service';
    setBookingServiceTitle(svcTitle);
    setBookingDate('Today');
    setBookingTime('11:00 AM');
    setBookingAddress(user?.address || 'Saved Home Address');
    setBookingNotes('');
    setBookingModalVisible(true);
  };



  // Pro Detail Handler
  const handleOpenProDetail = async (pro: ProfessionalProfile) => {
    setProDetailPro(pro);
    const ratings = await professionalMarketplaceService.getRatingsForProfessional(pro.id);
    setProDetailRatings(ratings);
    setProDetailModalVisible(true);
  };

  // Rating Handler
  const handleOpenRatingModal = (pro: ProfessionalProfile, bookingId?: string) => {
    setRatingPro(pro);
    setRatingBookingId(bookingId || null);
    setRatingStars(5);
    setRatingComment('');
    setRatingModalVisible(true);
  };

  const handleSubmitRating = async () => {
    if (!ratingPro) return;
    try {
      await professionalMarketplaceService.addRatingForProfessional({
        proId: ratingPro.id,
        userId: user?.id || 'usr',
        userName: user?.fullName || 'Satisfied Customer',
        rating: ratingStars,
        comment: ratingComment.trim(),
        bookingId: ratingBookingId || undefined,
      });

      addNotification({
        type: 'system',
        title: 'Rating Submitted ⭐',
        message: `Thank you for leaving a ${ratingStars}-star rating for ${ratingPro.name}!`,
      });

      Alert.alert(
        '⭐ Thank You!',
        `Your ${ratingStars}-star rating for ${ratingPro.name} has been saved successfully.`,
        [{ text: 'OK', onPress: () => setRatingModalVisible(false) }],
      );

      await loadUserData();
    } catch (e) {
      Alert.alert('Error', 'Failed to submit rating. Please try again.');
    }
  };

  // Navigate to Services tab
  const handleBooking = (label?: string) => {
    setActiveTab('Services');
  };

  // Promo 20% OFF Check Logic based on User Phone Number
  const handlePromoBannerClick = async () => {
    const userPhone = user?.phone?.trim();
    const phoneKey = (userPhone || user?.id || 'guest').replace(/[^a-zA-Z0-9]/g, '');

    try {
      const alreadyUsed = await AsyncStorage.getItem(`@fixnest_promo_used_${phoneKey}`);
      if (alreadyUsed === 'true') {
        Alert.alert(
          'Offer Already Claimed',
          `You have already used your 20% first booking discount for mobile number ${userPhone || 'associated with your account'}. This offer is valid only for first-time bookings on FixNest.`,
          [{ text: 'OK' }]
        );
        return;
      }
    } catch (e) {
      console.warn('[HomeScreen] Error checking promo usage:', e);
    }

    // First time booking for this mobile number!
    setIsFirstBookingPromoActive(true);
    setActiveTab('Services');
  };

  const handleSelectEmergencyItem = (item: EmergencyNumberItem) => {
    setSelectedEmergency(item);
    setConfirmCallModalVisible(true);
  };

  const handleConfirmEmergencyCall = async () => {
    if (!selectedEmergency) return;
    const cleanNumber = selectedEmergency.number.replace(/[^0-9+]/g, '');
    const telUrl = `tel:${cleanNumber}`;

    setConfirmCallModalVisible(false);
    setEmergencyModalVisible(false);

    try {
      const canOpen = await Linking.canOpenURL(telUrl);
      if (canOpen || Platform.OS === 'web') {
        await Linking.openURL(telUrl);
      } else {
        Alert.alert('Emergency Dial', `Calling ${selectedEmergency.title}: ${selectedEmergency.number}`);
      }
    } catch (err) {
      console.error('[HomeScreen] Error initiating phone call:', err);
      if (Platform.OS === 'web') {
        window.location.href = telUrl;
      }
    }
  };

  // Tab Views Rendering
  const renderHomeContent = () => (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {/* 1. Quick Actions (3 Cards: Book Service -> Services Tab, Ask AI -> AI Tab, Emergency -> India Numbers) */}
      <View style={styles.quickActionsGrid}>
        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => setActiveTab('Services')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Calendar size={22} color={Colors.primary} />
          </View>
          <Text style={styles.quickTitle}>Book Service</Text>
          <Text style={styles.quickSubtitle}>Schedule now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => setActiveTab('AI')}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(147, 51, 234, 0.15)' }]}>
            <Sparkles size={22} color="#A855F7" />
          </View>
          <Text style={styles.quickTitle}>Ask FixNest AI</Text>
          <Text style={styles.quickSubtitle}>Instant diagnosis</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickCard}
          onPress={() => setEmergencyModalVisible(true)}
          activeOpacity={0.8}
        >
          <View style={[styles.quickIconCircle, { backgroundColor: 'rgba(239, 68, 68, 0.15)' }]}>
            <AlertTriangle size={22} color="#EF4444" />
          </View>
          <Text style={styles.quickTitle}>Emergency Help</Text>
          <Text style={[styles.quickSubtitle, { color: '#EF4444' }]}>24/7 Priority</Text>
        </TouchableOpacity>
      </View>

      {/* 2. Featured 20% OFF Banner */}
      <View style={styles.featuredCard}>
        <View style={styles.bannerGlow} />
        <View style={styles.bannerContent}>
          <View style={styles.promoTag}>
            <Text style={styles.promoTagText}>FIRST BOOKING OFFER</Text>
          </View>
          <Text style={styles.bannerTitle}>Get 20% OFF Your First Service</Text>
          <Text style={styles.bannerSubtitle}>
            Applicable for first-time service bookings per mobile number. Verified professionals available.
          </Text>
          <TouchableOpacity
            style={styles.bannerBtn}
            onPress={handlePromoBannerClick}
            activeOpacity={0.8}
          >
            <Text style={styles.bannerBtnText}>Book Now</Text>
            <ArrowRight size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 3. Full Rich Service Categories (Row & Grid layout) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Service Categories</Text>
          <TouchableOpacity onPress={() => setActiveTab('Services')}>
            <Text style={styles.seeAllText}>See All ({HOUSEHOLD_SERVICES.length})</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesScroll}
        >
          {homeCategoryList.map((cat) => {
            const IconComp = getServiceIcon(cat.iconName);
            return (
              <TouchableOpacity
                key={cat.id}
                style={styles.categoryCard}
                onPress={() => setSelectedService(cat)}
                activeOpacity={0.75}
              >
                {cat.badge && (
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryBadgeText}>{cat.badge}</Text>
                  </View>
                )}
                <View style={styles.categoryIconCircle}>
                  <IconComp size={22} color={Colors.primary} />
                </View>
                <Text style={styles.categoryTitle}>{cat.title}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* 6. AI Assistant Card */}
      <View style={styles.aiCard}>
        <View style={styles.aiHeader}>
          <View style={styles.aiBadgeIcon}>
            <Sparkles size={20} color="#00E5FF" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.aiCardTitle}>Need help identifying a problem?</Text>
            <Text style={styles.aiCardSub}>
              Snap a photo or describe the issue. Our AI assistant provides instant diagnosis & cost estimation.
            </Text>
          </View>
        </View>
        <TouchableOpacity
          style={styles.aiActionBtn}
          onPress={() => setActiveTab('AI')}
          activeOpacity={0.8}
        >
          <Sparkles size={16} color="#FFFFFF" />
          <Text style={styles.aiActionBtnText}>Ask AI</Text>
        </TouchableOpacity>
      </View>

      {/* 7. Nearby Professionals (Horizontal Scroll) */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nearby Professionals</Text>
          <TouchableOpacity onPress={() => setActiveTab('Services')}>
            <Text style={styles.seeAllText}>Browse All</Text>
          </TouchableOpacity>
        </View>

        {nearbyPros.length > 0 ? (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.prosScroll}
          >
            {nearbyPros.map((pro) => (
              <TouchableOpacity
                key={pro.id}
                style={styles.proCard}
                onPress={() => handleOpenProDetail(pro)}
                activeOpacity={0.9}
              >
                {pro.photoUrl ? (
                  <Image source={{ uri: pro.photoUrl }} style={styles.proAvatar} />
                ) : (
                  <View style={[styles.proAvatar, { backgroundColor: Colors.surfaceElevated, alignItems: 'center', justifyContent: 'center' }]}>
                    <User size={24} color={Colors.textMuted} />
                  </View>
                )}
                <View style={styles.proInfo}>
                  <Text style={styles.proName} numberOfLines={1}>{pro.name}</Text>
                  <Text style={styles.proSpecialty} numberOfLines={1}>
                    {pro.services.slice(0, 2).map((sid) => {
                      const svc = HOUSEHOLD_SERVICES.find((s) => s.id === sid);
                      return svc?.title;
                    }).filter(Boolean).join(', ') || 'Pro Service'}
                  </Text>

                  <View style={styles.ratingRow}>
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.ratingText}>{pro.rating.toFixed(1)}</Text>
                    <Text style={styles.reviewsText}>({pro.completedJobs} jobs)</Text>
                  </View>

                  <View style={styles.proMetaRow}>
                    <MapPin size={12} color={Colors.textMuted} />
                    <Text style={styles.distanceText}>{pro.currentLocation.city}</Text>
                    {pro.availability ? (
                      <Text style={[styles.distanceText, { color: Colors.success, marginLeft: 6 }]}>● Available</Text>
                    ) : (
                      <Text style={[styles.distanceText, { color: Colors.error, marginLeft: 6 }]}>● Busy</Text>
                    )}
                  </View>

                  {/* Side-by-Side Action Buttons: Chat & Book */}
                  <View style={styles.proFooterActions}>
                    <TouchableOpacity
                      style={styles.proChatBtn}
                      onPress={() => handleOpenProChat(pro)}
                      activeOpacity={0.8}
                    >
                      <MessageSquare size={13} color="#A855F7" />
                      <Text style={styles.proChatBtnText}>Chat</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.proBookBtn}
                      onPress={() => handleOpenBookingModal(pro)}
                      activeOpacity={0.85}
                    >
                      <Calendar size={13} color="#FFFFFF" />
                      <Text style={styles.proBookText}>Book</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyBookingsCard}>
            <User size={28} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No professionals registered yet</Text>
            <Text style={styles.emptySub}>
              Switch to Professional Mode to set up your pro profile, and it will appear here for all users!
            </Text>
          </View>
        )}
      </View>

      {/* 8. Recent Bookings */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Bookings</Text>
          <TouchableOpacity onPress={() => setActiveTab('Bookings')}>
            <Text style={styles.seeAllText}>History</Text>
          </TouchableOpacity>
        </View>

        {recentBookings.length > 0 ? (
          recentBookings.map((b) => (
            <View key={b.id} style={styles.bookingCard}>
              <View style={styles.bookingIconCircle}>
                <CheckCircle2 size={22} color={Colors.success} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.bookingService}>{b.service}</Text>
                <View style={styles.bookingMetaRow}>
                  <Clock size={12} color={Colors.textMuted} />
                  <Text style={styles.bookingDate}>{b.date}</Text>
                </View>
                <Text style={styles.bookingTech}>Tech: {b.technician}</Text>
              </View>
              <View style={styles.bookingRight}>
                <Text style={styles.bookingAmount}>{b.amount}</Text>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusBadgeText}>{b.status}</Text>
                </View>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyBookingsCard}>
            <Calendar size={36} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No bookings yet.</Text>
            <Text style={styles.emptySub}>
              Your scheduled and completed service requests will appear here.
            </Text>
          </View>
        )}
      </View>

      <View style={{ height: 90 }} />
    </ScrollView>
  );

  const renderServicesTab = () => {
    const filteredServices = HOUSEHOLD_SERVICES.filter((service) => {
      const matchesGroup =
        selectedGroup === 'All' || service.categoryGroup === selectedGroup;
      const matchesSearch =
        !searchQuery.trim() ||
        service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.categoryGroup.toLowerCase().includes(searchQuery.toLowerCase()) ||
        service.description.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesGroup && matchesSearch;
    });

    return (
      <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          onPress={() => setActiveTab('Home')}
          style={styles.pageBackBtn}
          activeOpacity={0.75}
        >
          <ArrowLeft size={18} color={Colors.textPrimary} />
          <Text style={styles.pageBackBtnText}>Back to Home</Text>
        </TouchableOpacity>
        <Text style={styles.tabTitle}>Home Services Catalog</Text>
        <Text style={styles.tabSubtitle}>
          Explore 50+ household service categories with upfront pricing & certified professionals
        </Text>

        {/* Catalog Search Bar */}
        <View style={styles.catalogSearchBox}>
          <Search size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.catalogSearchInput}
            placeholder="Search services..."
            placeholderTextColor={Colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {!!searchQuery && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        {/* Group Filter Pills */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.groupPillsScroll}
        >
          {SERVICE_GROUPS.map((group) => {
            const isSelected = selectedGroup === group;
            return (
              <TouchableOpacity
                key={group}
                style={[
                  styles.groupPill,
                  isSelected && styles.groupPillActive,
                ]}
                onPress={() => setSelectedGroup(group)}
              >
                <Text
                  style={[
                    styles.groupPillText,
                    isSelected && styles.groupPillTextActive,
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Category Result Count Bar */}
        <View style={styles.resultsCountBar}>
          <Text style={styles.resultsCountText}>
            Showing <Text style={{ color: Colors.primary, fontWeight: '700' }}>{filteredServices.length}</Text> services
            {selectedGroup !== 'All' ? ` in ${selectedGroup}` : ''}
          </Text>
        </View>

        {/* Full Service Catalog Cards */}
        <View style={styles.servicesGridFull}>
          {filteredServices.length > 0 ? (
            filteredServices.map((cat) => {
              const IconComp = getServiceIcon(cat.iconName);
              return (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.fullServiceCard}
                  onPress={() => setSelectedService(cat)}
                  activeOpacity={0.8}
                >
                  <View style={styles.fullServiceIcon}>
                    <IconComp size={24} color={Colors.primary} />
                  </View>
                  <View style={{ flex: 1, paddingRight: 8 }}>
                    <View style={styles.serviceTitleRow}>
                      <Text style={styles.fullServiceTitle}>{cat.title}</Text>
                      {cat.badge && (
                        <View style={styles.miniBadgeTag}>
                          <Text style={styles.miniBadgeText}>{cat.badge}</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.fullServiceGroupTag}>{cat.categoryGroup}</Text>
                    <Text style={styles.fullServiceDesc} numberOfLines={2}>
                      {cat.description}
                    </Text>

                    <View style={styles.fullServiceFooterRow}>
                      <Text style={styles.fullServicePriceTag}>{cat.priceRange.split('(')[0]}</Text>
                      <Text style={styles.fullServiceDurationTag}>• {cat.estimatedDuration}</Text>
                    </View>
                  </View>
                  <ChevronRight size={18} color={Colors.textMuted} />
                </TouchableOpacity>
              );
            })
          ) : (
            <View style={styles.emptyCatalogBox}>
              <Search size={32} color={Colors.textMuted} />
              <Text style={styles.emptyCatalogTitle}>No matching services found</Text>
              <Text style={styles.emptyCatalogSub}>
                Try searching for another service like "Plumber", "AC Service", or "Painting".
              </Text>
            </View>
          )}
        </View>
        <View style={{ height: 90 }} />
      </ScrollView>
    );
  };

  const renderAiTab = () => <AskAIScreen onBack={() => setActiveTab('Home')} />;

  const renderBookingsTab = () => (
    <ScrollView contentContainerStyle={styles.tabScrollContent} showsVerticalScrollIndicator={false}>
      <TouchableOpacity
        onPress={() => setActiveTab('Home')}
        style={styles.pageBackBtn}
        activeOpacity={0.75}
      >
        <ArrowLeft size={18} color={Colors.textPrimary} />
        <Text style={styles.pageBackBtnText}>Back to Home</Text>
      </TouchableOpacity>
      <Text style={styles.tabTitle}>My Service Bookings</Text>
      <Text style={styles.tabSubtitle}>Track active, upcoming, and past home repair appointments</Text>
      
      {recentBookings.length > 0 ? (
        recentBookings.map((b: any) => {
          const proObj = nearbyPros.find((p) => p.id === b.professionalId);
          const statusColor =
            b.status === 'accepted' ? Colors.success
            : b.status === 'rejected' ? Colors.error
            : b.status === 'completed' ? Colors.primary
            : Colors.warning;

          return (
            <View key={b.id} style={styles.userBookingCard}>
              <View style={styles.bookingHeaderRow}>
                <View style={styles.serviceIconCircle}>
                  <Briefcase size={20} color={Colors.primary} />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.userBookingTitle}>{b.serviceTitle}</Text>
                  <Text style={styles.userBookingPro}>
                    Pro: {b.professionalName || proObj?.name || 'Assigned Professional'}
                  </Text>
                </View>
                <View style={[styles.userStatusBadge, { backgroundColor: `${statusColor}22` }]}>
                  <Text style={[styles.userStatusText, { color: statusColor }]}>
                    {b.status === 'pending' ? 'Pending Confirmation' : b.status.toUpperCase()}
                  </Text>
                </View>
              </View>

              <View style={styles.userBookingDetails}>
                <View style={styles.userBookingMetaRow}>
                  <Clock size={13} color={Colors.textMuted} />
                  <Text style={styles.userBookingMetaText}>
                    Date: {b.scheduledDate || 'Flexible'} {b.scheduledTime ? `at ${b.scheduledTime}` : ''}
                  </Text>
                </View>
                <View style={styles.userBookingMetaRow}>
                  <MapPin size={13} color={Colors.textMuted} />
                  <Text style={styles.userBookingMetaText}>{b.address || 'Saved Address'}</Text>
                </View>
              </View>

              {/* Action buttons */}
              <View style={styles.userBookingActions}>
                {proObj && (
                  <TouchableOpacity
                    style={styles.userChatActionBtn}
                    onPress={() => handleOpenProChat(proObj)}
                    activeOpacity={0.8}
                  >
                    <MessageSquare size={14} color="#A855F7" />
                    <Text style={styles.userChatActionText}>Chat with Pro</Text>
                  </TouchableOpacity>
                )}

                {(b.status === 'completed' || b.status === 'accepted') && proObj && (
                  <TouchableOpacity
                    style={styles.userRateActionBtn}
                    onPress={() => handleOpenRatingModal(proObj, b.id)}
                    activeOpacity={0.8}
                  >
                    <Star size={14} color="#F59E0B" fill="#F59E0B" />
                    <Text style={styles.userRateActionText}>Rate Professional</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })
      ) : (
        <View style={styles.emptyBookingsCard}>
          <Calendar size={44} color={Colors.primary} style={{ opacity: 0.6 }} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            Schedule your first home repair with a certified professional.
          </Text>
          <TouchableOpacity
            style={styles.bookNowCtaBtn}
            onPress={() => setActiveTab('Services')}
            activeOpacity={0.85}
          >
            <Calendar size={16} color="#FFFFFF" />
            <Text style={styles.bookNowCtaText}>Browse Services</Text>
          </TouchableOpacity>
        </View>
      )}
      <View style={{ height: 90 }} />
    </ScrollView>
  );

  const renderProfileTab = () => <ProfileScreen onBack={() => setActiveTab('Home')} />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
      
      {/* 1. Header (Greeting, Supabase username, Notification icon, Avatar) */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.avatarCircle} onPress={() => setActiveTab('Profile')}>
            <User size={18} color={Colors.primary} />
          </TouchableOpacity>
          <View style={styles.greetingCol}>
            <Text style={styles.greetingText}>{getGreeting()}</Text>
            <Text style={styles.userNameText} numberOfLines={1}>
              {user?.fullName || 'User'}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => {
              markAllRead();
              setNotificationsVisible(true);
            }}
          >
            <Bell size={20} color={Colors.textPrimary} />
            {unreadCount > 0 && (
              <View style={styles.notifBadge}>
                <Text style={styles.notifBadgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Dynamic Tab Body */}
      {activeTab === 'Home' && renderHomeContent()}
      {activeTab === 'Services' && renderServicesTab()}
      {activeTab === 'AI' && renderAiTab()}
      {activeTab === 'Bookings' && renderBookingsTab()}
      {activeTab === 'Profile' && renderProfileTab()}

      {/* 9. Bottom Navigation Bar */}
      <BottomTabBar activeTab={activeTab} onTabPress={setActiveTab} />

      {/* Service Details Page & Location Booking Modal */}
      <ServiceDetailModal
        service={selectedService}
        visible={!!selectedService}
        onClose={() => setSelectedService(null)}
      />

      {/* Notifications Modal */}
      <Modal
        visible={notificationsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setNotificationsVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setNotificationsVisible(false)}
        >
          <View style={styles.modalContent}>
            <View style={styles.notifModalHeader}>
              <Text style={styles.modalTitle}>Notifications</Text>
              {notifications.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    clearAll();
                    setNotificationsVisible(false);
                  }}
                >
                  <Text style={styles.notifMarkReadText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {notifications.length === 0 ? (
              <View style={styles.notifEmptyBox}>
                <Bell size={32} color={Colors.textMuted} />
                <Text style={styles.notifEmptyTitle}>No notifications yet</Text>
                <Text style={styles.notifEmptyDesc}>
                  You'll be notified when you book a service or get an AI insight.
                </Text>
              </View>
            ) : (
              <ScrollView
                style={{ maxHeight: 340 }}
                showsVerticalScrollIndicator={false}
              >
                {notifications.map((notif) => {
                  const iconColor =
                    notif.type === 'booking' ? Colors.success
                    : notif.type === 'ai' ? Colors.primary
                    : notif.type === 'rating' ? '#F59E0B'
                    : Colors.textMuted;
                  const IconComp =
                    notif.type === 'booking' ? CheckCircle2
                    : notif.type === 'ai' ? Sparkles
                    : notif.type === 'rating' ? Star
                    : ShieldCheck;
                  return (
                    <TouchableOpacity
                      key={notif.id}
                      style={[
                        styles.notifItem,
                        !notif.read && styles.notifItemUnread,
                      ]}
                      onPress={async () => {
                        if (notif.actionPayload?.proId) {
                          setNotificationsVisible(false);
                          const pro = await professionalMarketplaceService.getProfessionalById(notif.actionPayload.proId);
                          if (pro) {
                            handleOpenRatingModal(pro, notif.actionPayload.bookingId);
                          }
                        }
                      }}
                      activeOpacity={notif.actionPayload?.proId ? 0.75 : 1}
                    >
                      <View style={[styles.notifIconCircle, { backgroundColor: `${iconColor}22` }]}>
                        <IconComp size={16} color={iconColor} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.notifItemTitle}>{notif.title}</Text>
                        <Text style={styles.notifItemDesc}>{notif.message}</Text>
                        <Text style={styles.notifItemTime}>{notif.timestamp}</Text>
                      </View>
                      {notif.type === 'rating' && (
                        <View style={{ backgroundColor: 'rgba(245,158,11,0.15)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 4 }}>
                          <Text style={{ color: '#F59E0B', fontSize: 10, fontWeight: '800' }}>RATE ⭐</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setNotificationsVisible(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Emergency Numbers Modal */}
      <Modal
        visible={emergencyModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEmergencyModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '85%' }]}>
            <View style={styles.emergencyHeader}>
              <View style={styles.emergencyTitleRow}>
                <View style={styles.emergencyIconBadge}>
                  <AlertTriangle size={20} color="#EF4444" />
                </View>
                <Text style={styles.emergencyTitle}>Emergency Numbers</Text>
              </View>
              <TouchableOpacity onPress={() => setEmergencyModalVisible(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>
            <Text style={styles.emergencySubtitle}>Tap any number to call immediately</Text>

            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
              {INDIA_EMERGENCY_NUMBERS.map((item) => {
                const IconComp = item.icon;
                return (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.emergencyItem}
                    onPress={() => handleSelectEmergencyItem(item)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.emergencyItemIcon, { backgroundColor: `${item.color}22` }]}>
                      <IconComp size={20} color={item.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.emergencyItemTitle}>{item.title}</Text>
                      <Text style={styles.emergencyItemSub} numberOfLines={2}>{item.subtitle}</Text>
                    </View>
                    <View style={styles.emergencyNumberBadge}>
                      <Phone size={12} color={item.color} />
                      <Text style={[styles.emergencyNumber, { color: item.color }]}>{item.number}</Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              <View style={{ height: 16 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Confirm Emergency Call Modal */}
      <Modal
        visible={confirmCallModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmCallModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 24 }]}>
            <View style={styles.confirmCallIcon}>
              <PhoneOutgoing size={28} color="#EF4444" />
            </View>
            <Text style={styles.confirmCallTitle}>Confirm Emergency Call</Text>
            <Text style={styles.confirmCallSub}>
              You are about to call{' '}
              <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>
                {selectedEmergency?.title}
              </Text>
            </Text>
            <Text style={styles.confirmCallNumber}>{selectedEmergency?.number}</Text>

            <View style={styles.confirmCallActions}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setConfirmCallModalVisible(false)}
              >
                <Text style={styles.confirmCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmCallBtn}
                onPress={handleConfirmEmergencyCall}
                activeOpacity={0.85}
              >
                <Phone size={16} color="#FFFFFF" />
                <Text style={styles.confirmCallBtnText}>Call Now</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 1. Appointment Booking & Date/Time Selection Modal */}
      <Modal
        visible={bookingModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBookingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>📅 Schedule Appointment</Text>
              <TouchableOpacity onPress={() => setBookingModalVisible(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {bookingPro && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {/* Pro info summary */}
                <View style={styles.proBookingSummaryBox}>
                  {bookingPro.photoUrl ? (
                    <Image source={{ uri: bookingPro.photoUrl }} style={styles.proBookingAvatar} />
                  ) : (
                    <View style={styles.proBookingAvatarPlaceholder}>
                      <User size={24} color="#A855F7" />
                    </View>
                  )}
                  <View style={{ flex: 1 }}>
                    <Text style={styles.proBookingName}>{bookingPro.name}</Text>
                    <Text style={styles.proBookingService}>{bookingServiceTitle}</Text>
                    <Text style={styles.proBookingCity}>📍 {bookingPro.currentLocation.city}</Text>
                  </View>
                </View>

                {/* Date Selection */}
                <Text style={styles.inputLabel}>Select Appointment Date *</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillsScroll}>
                  {['Today', 'Tomorrow', 'Day After Tomorrow', 'This Weekend', 'Next Week'].map((d) => (
                    <TouchableOpacity
                      key={d}
                      style={[styles.pillBtn, bookingDate === d && styles.pillBtnActive]}
                      onPress={() => setBookingDate(d)}
                    >
                      <Text style={[styles.pillText, bookingDate === d && styles.pillTextActive]}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {/* Time Slot Selection */}
                <Text style={styles.inputLabel}>Select Time Slot *</Text>
                <View style={styles.timeSlotsGrid}>
                  {['09:00 AM', '11:00 AM', '02:00 PM', '04:00 PM', '06:00 PM'].map((t) => (
                    <TouchableOpacity
                      key={t}
                      style={[styles.timeSlotBtn, bookingTime === t && styles.timeSlotBtnActive]}
                      onPress={() => setBookingTime(t)}
                    >
                      <Clock size={12} color={bookingTime === t ? '#A855F7' : Colors.textMuted} />
                      <Text style={[styles.timeSlotText, bookingTime === t && styles.timeSlotTextActive]}>{t}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Address Input */}
                <Text style={styles.inputLabel}>Service Address *</Text>
                <TextInput
                  style={styles.modalTextInput}
                  value={bookingAddress}
                  onChangeText={setBookingAddress}
                  placeholder="Enter full address..."
                  placeholderTextColor={Colors.textMuted}
                />

                {/* Notes Input */}
                <Text style={styles.inputLabel}>Additional Notes / Instructions (Optional)</Text>
                <TextInput
                  style={[styles.modalTextInput, { height: 70, textAlignVertical: 'top' }]}
                  value={bookingNotes}
                  onChangeText={setBookingNotes}
                  placeholder="Describe your issue or requirements..."
                  placeholderTextColor={Colors.textMuted}
                  multiline
                />

                {/* Confirmation Box */}
                <View style={styles.confirmSummaryCard}>
                  <Text style={styles.confirmSummaryTitle}>Booking Confirmation Summary</Text>
                  <Text style={styles.confirmSummaryLine}>• Service: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{bookingServiceTitle}</Text></Text>
                  <Text style={styles.confirmSummaryLine}>• Professional: <Text style={{ color: Colors.textPrimary, fontWeight: '700' }}>{bookingPro.name}</Text></Text>
                  <Text style={styles.confirmSummaryLine}>• Scheduled: <Text style={{ color: '#A855F7', fontWeight: '700' }}>{bookingDate} at {bookingTime}</Text></Text>
                  <Text style={styles.confirmSummaryLine}>• Status: <Text style={{ color: Colors.warning, fontWeight: '700' }}>Pending Professional Confirmation</Text></Text>
                </View>

                <TouchableOpacity
                  style={[styles.confirmBookingBtn, isSubmittingBooking && { opacity: 0.7 }]}
                  onPress={handleConfirmBooking}
                  disabled={isSubmittingBooking}
                  activeOpacity={0.85}
                >
                  <Calendar size={18} color="#FFFFFF" />
                  <Text style={styles.confirmBookingBtnText}>
                    {isSubmittingBooking ? 'Booking...' : 'Book Appointment'}
                  </Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 2. Direct User-Pro Chat Modal */}
      <Modal
        visible={proChatModalVisible}
        animationType="slide"
        onRequestClose={() => setProChatModalVisible(false)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.background }}>
          {/* Header */}
          <View style={styles.proChatHeader}>
            <TouchableOpacity
              onPress={() => setProChatModalVisible(false)}
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: 'rgba(255, 255, 255, 0.08)',
                paddingHorizontal: 10,
                paddingVertical: 6,
                borderRadius: 16,
                borderWidth: 1,
                borderColor: 'rgba(255, 255, 255, 0.15)',
                marginRight: 8,
                gap: 4,
              }}
              activeOpacity={0.75}
            >
              <ArrowLeft size={18} color={Colors.textPrimary} />
              <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '700' }}>Back</Text>
            </TouchableOpacity>
            {proChatPro?.photoUrl ? (
              <Image source={{ uri: proChatPro.photoUrl }} style={styles.proChatHeaderAvatar} />
            ) : (
              <View style={styles.proChatHeaderAvatarPlaceholder}>
                <User size={18} color="#A855F7" />
              </View>
            )}
            <View style={{ flex: 1, marginLeft: 10 }}>
              <Text style={styles.proChatHeaderName}>{proChatPro?.name || 'Professional'}</Text>
              <Text style={styles.proChatHeaderSub}>💬 In-App Enquiry & Chat</Text>
            </View>
          </View>

          {/* Messages */}
          <ScrollView
            style={{ flex: 1, padding: 16 }}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
            {proChatMessages.length === 0 ? (
              <View style={styles.chatEmptyBox}>
                <MessageSquare size={36} color={Colors.textMuted} />
                <Text style={styles.chatEmptyTitle}>Start a conversation with {proChatPro?.name}</Text>
                <Text style={styles.chatEmptySub}>Ask about availability, pricing estimates, or service details.</Text>
              </View>
            ) : (
              proChatMessages.map((msg) => {
                const isMe = msg.senderType === 'user';
                return (
                  <View
                    key={msg.id}
                    style={[styles.chatBubbleRow, isMe ? styles.chatBubbleRowMe : styles.chatBubbleRowPro]}
                  >
                    <View style={[styles.chatBubble, isMe ? styles.chatBubbleMe : styles.chatBubblePro]}>
                      <Text style={[styles.chatText, isMe ? styles.chatTextMe : styles.chatTextPro]}>
                        {msg.message}
                      </Text>
                      <Text style={[styles.chatTime, isMe ? { color: 'rgba(255,255,255,0.7)' } : { color: Colors.textMuted }]}>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>

          {/* Input */}
          <View style={styles.chatInputRow}>
            <TextInput
              style={styles.chatInput}
              placeholder="Type your message..."
              placeholderTextColor={Colors.textMuted}
              value={proChatInput}
              onChangeText={setProChatInput}
              onSubmitEditing={handleSendProChatMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.chatSendBtn, !proChatInput.trim() && { opacity: 0.5 }]}
              onPress={handleSendProChatMessage}
              disabled={!proChatInput.trim()}
            >
              <Send size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>

      {/* 3. Pro Detail & Ratings Modal */}
      <Modal
        visible={proDetailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setProDetailModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { maxHeight: '90%' }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>Professional Profile</Text>
              <TouchableOpacity onPress={() => setProDetailModalVisible(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {proDetailPro && (
              <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: 12 }}>
                {/* Pro Hero */}
                <View style={styles.proDetailHero}>
                  {proDetailPro.photoUrl ? (
                    <Image source={{ uri: proDetailPro.photoUrl }} style={styles.proDetailAvatar} />
                  ) : (
                    <View style={styles.proDetailAvatarPlaceholder}>
                      <User size={36} color="#A855F7" />
                    </View>
                  )}
                  <Text style={styles.proDetailName}>{proDetailPro.name}</Text>
                  <Text style={styles.proDetailLocation}>📍 {proDetailPro.currentLocation.city} • {proDetailPro.experience} Experience</Text>

                  <View style={styles.proDetailStatsRow}>
                    <View style={styles.proDetailStatBox}>
                      <Star size={16} color="#F59E0B" fill="#F59E0B" />
                      <Text style={styles.proDetailStatVal}>{proDetailPro.rating.toFixed(1)}</Text>
                      <Text style={styles.proDetailStatLabel}>Rating</Text>
                    </View>
                    <View style={styles.proDetailStatBox}>
                      <Text style={styles.proDetailStatVal}>{proDetailPro.completedJobs}</Text>
                      <Text style={styles.proDetailStatLabel}>Jobs Done</Text>
                    </View>
                  </View>
                </View>

                {/* Bio */}
                <View style={styles.proDetailSection}>
                  <Text style={styles.proDetailSectionTitle}>About & Bio</Text>
                  <Text style={styles.proDetailBioText}>{proDetailPro.bio || 'Verified FixNest service provider.'}</Text>
                </View>

                {/* Working Areas */}
                <View style={styles.proDetailSection}>
                  <Text style={styles.proDetailSectionTitle}>Serving Areas</Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                    {proDetailPro.workingAreas.map((area) => (
                      <View key={area} style={styles.areaTagPill}>
                        <Text style={styles.areaTagText}>📍 {area}</Text>
                      </View>
                    ))}
                  </View>
                </View>

                {/* Ratings & Reviews */}
                <View style={styles.proDetailSection}>
                  <Text style={styles.proDetailSectionTitle}>Customer Ratings & Reviews ({proDetailRatings.length})</Text>
                  {proDetailRatings.length === 0 ? (
                    <Text style={{ fontSize: 12, color: Colors.textMuted, marginTop: 6 }}>No reviews submitted yet.</Text>
                  ) : (
                    proDetailRatings.map((r) => (
                      <View key={r.id} style={styles.reviewItemCard}>
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Text style={styles.reviewerName}>{r.userName}</Text>
                          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
                            <Star size={13} color="#F59E0B" fill="#F59E0B" />
                            <Text style={{ fontSize: 12, fontWeight: '700', color: Colors.textPrimary }}>{r.rating}</Text>
                          </View>
                        </View>
                        {r.comment ? <Text style={styles.reviewComment}>{r.comment}</Text> : null}
                      </View>
                    ))
                  )}
                </View>

                {/* Actions */}
                <View style={styles.proDetailActionsRow}>
                  <TouchableOpacity
                    style={styles.proDetailChatBtn}
                    onPress={() => {
                      setProDetailModalVisible(false);
                      handleOpenProChat(proDetailPro);
                    }}
                  >
                    <MessageSquare size={16} color="#A855F7" />
                    <Text style={styles.proDetailChatText}>Chat</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.proDetailBookBtn}
                    onPress={() => {
                      setProDetailModalVisible(false);
                      handleOpenBookingModal(proDetailPro);
                    }}
                  >
                    <Calendar size={16} color="#FFFFFF" />
                    <Text style={styles.proDetailBookText}>Book Appointment</Text>
                  </TouchableOpacity>
                </View>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* 4. Rating Modal */}
      <Modal
        visible={ratingModalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setRatingModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { padding: 20 }]}>
            <View style={styles.modalHeaderRow}>
              <Text style={styles.modalHeaderTitle}>⭐ Rate Professional</Text>
              <TouchableOpacity onPress={() => setRatingModalVisible(false)}>
                <X size={22} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            {ratingPro && (
              <View style={{ marginTop: 14, alignItems: 'center' }}>
                <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.textPrimary }}>
                  How was your service with {ratingPro.name}?
                </Text>

                {/* 5-Star Selector */}
                <View style={{ flexDirection: 'row', gap: 10, marginVertical: 18 }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <TouchableOpacity key={star} onPress={() => setRatingStars(star)} activeOpacity={0.8}>
                      <Star
                        size={32}
                        color="#F59E0B"
                        fill={star <= ratingStars ? '#F59E0B' : 'transparent'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={[styles.modalTextInput, { height: 80, textAlignVertical: 'top', width: '100%' }]}
                  placeholder="Share your experience (optional)..."
                  placeholderTextColor={Colors.textMuted}
                  value={ratingComment}
                  onChangeText={setRatingComment}
                  multiline
                />

                <TouchableOpacity
                  style={[styles.confirmBookingBtn, { width: '100%', marginTop: 14 }]}
                  onPress={handleSubmitRating}
                >
                  <Star size={16} color="#FFFFFF" fill="#FFFFFF" />
                  <Text style={styles.confirmBookingBtnText}>Submit Rating</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 14,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingCol: {
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  userNameText: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  notifBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  notifBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: Colors.primary,
    borderRadius: 8,
    width: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notifBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
  },
  tabScrollContent: {
    padding: 20,
  },
  searchContainer: {
    marginBottom: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  filterBtn: {
    padding: 6,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 22,
  },
  quickCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    alignItems: 'center',
  },
  quickIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  quickTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'center',
  },
  quickSubtitle: {
    color: Colors.textMuted,
    fontSize: 10,
    marginTop: 2,
    textAlign: 'center',
  },
  featuredCard: {
    backgroundColor: '#0F172A',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    padding: 20,
    marginBottom: 24,
    position: 'relative',
    overflow: 'hidden',
  },
  bannerGlow: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryGlow,
  },
  bannerContent: {
    zIndex: 1,
  },
  promoTag: {
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  promoTagText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 16,
  },
  bannerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    alignSelf: 'flex-start',
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
  bannerBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  seeAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  demoBadge: {
    backgroundColor: 'rgba(245,158,11,0.15)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  demoBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#F59E0B',
    letterSpacing: 0.3,
  },
  categoriesScroll: {
    gap: 12,
    paddingRight: 20,
  },
  categoryCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: 'center',
    width: 100,
    position: 'relative',
  },
  categoryCardActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  categoryBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  categoryBadgeText: {
    color: Colors.primary,
    fontSize: 8,
    fontWeight: '700',
  },
  categoryIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  categoryIconCircleActive: {
    backgroundColor: Colors.primary,
  },
  categoryTitle: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    textAlign: 'center',
  },
  aiCard: {
    backgroundColor: 'rgba(9, 24, 48, 0.8)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 229, 255, 0.3)',
    padding: 18,
    marginBottom: 24,
  },
  aiHeader: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
  },
  aiBadgeIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  aiCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  aiCardSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 17,
  },
  aiActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0066FF',
    paddingVertical: 10,
    borderRadius: 12,
  },
  aiActionBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  prosScroll: {
    gap: 14,
    paddingRight: 20,
  },
  proCard: {
    width: 220,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  proAvatar: {
    width: '100%',
    height: 120,
    backgroundColor: Colors.surfaceElevated,
  },
  proInfo: {
    padding: 12,
  },
  proName: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  proSpecialty: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    marginBottom: 6,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewsText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  proMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 10,
  },
  distanceText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  proFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  proPrice: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  proBookBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  proBookText: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  bookingCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  bookingIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookingService: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bookingDate: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  bookingTech: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  bookingRight: {
    alignItems: 'flex-end',
  },
  bookingAmount: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  statusBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 6,
  },
  statusBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '700',
  },
  emptyBookingsCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  tabSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 20,
  },
  servicesGridFull: {
    gap: 12,
  },
  fullServiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  fullServiceIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullServiceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fullServiceDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  aiHeroCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 22,
    alignItems: 'center',
  },
  aiBadgeGlow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 229, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  aiHeroTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 6,
  },
  aiHeroSub: {
    fontSize: 13,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  aiInputBox: {
    width: '100%',
  },
  aiTextInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    textAlignVertical: 'top',
    height: 100,
    marginBottom: 14,
  },
  aiSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
  },
  aiSubmitBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  profileHeaderCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  profileBigAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  profileEmail: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  guestPill: {
    marginTop: 10,
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 10,
  },
  guestPillText: {
    color: Colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  profileSection: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 10,
  },
  profileOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
  },
  profileOptionText: {
    fontSize: 15,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 16,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  notifItemUnread: {
    borderWidth: 1,
    borderColor: 'rgba(59,130,246,0.35)',
    backgroundColor: 'rgba(59,130,246,0.07)',
  },
  notifIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  notifItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  notifItemDesc: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 17,
  },
  notifItemTime: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 4,
    fontWeight: '500',
  },
  notifModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  notifMarkReadText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  notifEmptyBox: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 12,
  },
  notifEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 4,
  },
  notifEmptyDesc: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 17,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  catalogSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
    marginBottom: 14,
  },
  catalogSearchInput: {
    flex: 1,
    marginLeft: 10,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  groupPillsScroll: {
    gap: 8,
    paddingBottom: 12,
  },
  groupPill: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupPillActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  groupPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  groupPillTextActive: {
    color: '#FFFFFF',
  },
  resultsCountBar: {
    marginVertical: 10,
  },
  resultsCountText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  serviceTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  miniBadgeTag: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  miniBadgeText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  fullServiceGroupTag: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  fullServiceFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  fullServicePriceTag: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  fullServiceDurationTag: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 6,
  },
  emptyCatalogBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyCatalogTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
  },
  emptyCatalogSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 6,
    lineHeight: 18,
  },
  modalCloseBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  // Bookings CTA
  bookNowCtaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 14,
    marginTop: 16,
  },
  bookNowCtaText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Emergency Modal styles
  emergencyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  emergencyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  emergencyIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  emergencySubtitle: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 4,
  },
  emergencyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emergencyItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emergencyItemTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emergencyItemSub: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
    lineHeight: 15,
  },
  emergencyNumberBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surface,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  emergencyNumber: {
    fontSize: 13,
    fontWeight: '800',
  },
  // Confirm Call Modal
  confirmCallIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginBottom: 16,
  },
  confirmCallTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmCallSub: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 8,
  },
  confirmCallNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#EF4444',
    textAlign: 'center',
    marginBottom: 24,
    letterSpacing: 1,
  },
  confirmCallActions: {
    flexDirection: 'row',
    gap: 12,
  },
  confirmCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  confirmCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '700',
  },
  confirmCallBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#EF4444',
    paddingVertical: 12,
    borderRadius: 14,
  },
  confirmCallBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  // Pro Card Action Footer
  proFooterActions: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 8,
  },
  proChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  proChatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#A855F7',
  },
  proBookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  proBookText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Modal General Headers
  modalHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  modalHeaderTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 12,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  // Booking Summary Box
  proBookingSummaryBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proBookingAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  proBookingAvatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proBookingName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  proBookingService: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 1,
  },
  proBookingCity: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  // Pills & Time Slots
  pillsScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  pillBtn: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  pillBtnActive: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderColor: '#A855F7',
  },
  pillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  pillTextActive: {
    color: '#A855F7',
    fontWeight: '700',
  },
  timeSlotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  timeSlotBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  timeSlotBtnActive: {
    backgroundColor: 'rgba(168,85,247,0.15)',
    borderColor: '#A855F7',
  },
  timeSlotText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  timeSlotTextActive: {
    color: '#A855F7',
    fontWeight: '700',
  },
  modalTextInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    color: Colors.textPrimary,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    marginBottom: 8,
  },
  confirmSummaryCard: {
    backgroundColor: 'rgba(168,85,247,0.08)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
    padding: 12,
    marginVertical: 12,
    gap: 4,
  },
  confirmSummaryTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#A855F7',
    marginBottom: 4,
  },
  confirmSummaryLine: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  confirmBookingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 12,
  },
  confirmBookingBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Chat Modal Header & Bubbles
  proChatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  },
  proChatHeaderAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  proChatHeaderAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proChatHeaderName: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  proChatHeaderSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  chatEmptyBox: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 30,
    marginTop: 40,
  },
  chatEmptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 10,
    textAlign: 'center',
  },
  chatEmptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
  },
  chatBubbleRow: {
    marginBottom: 10,
    flexDirection: 'row',
  },
  chatBubbleRowMe: {
    justifyContent: 'flex-end',
  },
  chatBubbleRowPro: {
    justifyContent: 'flex-start',
  },
  chatBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 10,
    paddingHorizontal: 14,
  },
  chatBubbleMe: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 2,
  },
  chatBubblePro: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 2,
  },
  chatText: {
    fontSize: 13,
    lineHeight: 18,
  },
  chatTextMe: {
    color: '#FFFFFF',
  },
  chatTextPro: {
    color: Colors.textPrimary,
  },
  chatTime: {
    fontSize: 9,
    marginTop: 3,
    alignSelf: 'flex-end',
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surfaceCard,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: Colors.textPrimary,
    fontSize: 13,
  },
  chatSendBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Pro Detail Hero & Sections
  proDetailHero: {
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  proDetailAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: '#A855F7',
  },
  proDetailAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  proDetailName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  proDetailLocation: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  proDetailStatsRow: {
    flexDirection: 'row',
    gap: 20,
    marginTop: 12,
  },
  proDetailStatBox: {
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  proDetailStatVal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  proDetailStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 1,
  },
  proDetailSection: {
    marginTop: 14,
  },
  proDetailSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  proDetailBioText: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 18,
  },
  areaTagPill: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  areaTagText: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  reviewItemCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    padding: 10,
    marginTop: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  reviewerName: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  reviewComment: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 4,
  },
  proDetailActionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 18,
  },
  proDetailChatBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRadius: 12,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  proDetailChatText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#A855F7',
  },
  proDetailBookBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 11,
  },
  proDetailBookText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // User Booking Cards in Bookings Tab
  userBookingCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  bookingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userBookingTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  userBookingPro: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
    marginTop: 2,
  },
  userStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  userStatusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  userBookingDetails: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 4,
  },
  userBookingMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  userBookingMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userBookingActions: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  userChatActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.25)',
  },
  userChatActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#A855F7',
  },
  userRateActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    backgroundColor: 'rgba(245,158,11,0.12)',
    borderRadius: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: 'rgba(245,158,11,0.3)',
  },
  userRateActionText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
  },
  pageBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    marginBottom: 14,
    gap: 6,
  },
  pageBackBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
});
