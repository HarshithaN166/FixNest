import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  StatusBar,
  Platform,
  Alert,
  Image,
  Linking,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { resetToChooseRole } from '../../navigation/NavigationService';
import { useNotifications } from '../../context/NotificationContext';
import {
  Bell,
  Briefcase,
  Star,
  TrendingUp,
  CheckCircle2,
  Clock,
  User,
  MessageSquare,
  Phone,
  Mail,
  Send,
  X,
  ArrowLeft,
  MapPin,
  Zap,
  Activity,
  Settings,
  RefreshCw,
  ChevronRight,
  Circle,
  ToggleLeft,
  ToggleRight,
  Upload,
  Check,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useProfessional } from '../../context/ProfessionalContext';
import {
  ProfessionalBottomTabBar,
  ProTabType,
} from '../../components/professional/ProfessionalBottomTabBar';
import { BookingRequestCard } from '../../components/professional/BookingRequestCard';
import { ProfessionalProfileScreen } from './ProfessionalProfileScreen';
import { BookingRequest, ChatMessage } from '../../types/professional';
import { professionalMarketplaceService } from '../../services/professionalMarketplaceService';

const PURPLE = '#A855F7';

const AVATAR_DEFAULTS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
];

export const ProfessionalHomeScreen: React.FC = () => {
  const {
    proProfile,
    updateProProfile,
    userExistingProfiles,
    showProfileChoiceModal,
    selectExistingProfile,
    createNewProfile,
    requests,
    chats,
    refreshRequests,
    refreshChats,
    respondToRequest,
    sendMessage,
    unreadMessages,
    clearRole,
    setRole,
    switchToUser,
  } = useProfessional();
  const { addNotification } = useNotifications();

  const [activeTab, setActiveTab] = useState<ProTabType>('Home');
  const [chatBooking, setChatBooking] = useState<BookingRequest | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const chatScrollRef = useRef<ScrollView>(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  // If no profile yet, show profile setup
  const [showOnboarding, setShowOnboarding] = useState(!proProfile);

  useEffect(() => {
    setShowOnboarding(!proProfile);
  }, [proProfile?.id]);

  // ── Existing Profile Choice View ───────────────────────────────────────────
  if (showProfileChoiceModal || (!proProfile && userExistingProfiles.length > 0)) {
    return (
      <SafeAreaView style={[styles.safe, { paddingHorizontal: 20 }]}>
        <ScrollView
          contentContainerStyle={{ paddingVertical: 24, justifyContent: 'center' }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.choiceCard}>
            <View style={styles.choiceHeaderIcon}>
              <Briefcase size={32} color="#A855F7" />
            </View>
            <Text style={styles.choiceTitle}>Existing Professional Profiles</Text>
            <Text style={styles.choiceSub}>
              We found {userExistingProfiles.length} existing professional {userExistingProfiles.length === 1 ? 'profile' : 'profiles'} saved under your device/account. Select a profile to continue or create a new one.
            </Text>

            {/* List of ALL existing profiles */}
            <View style={{ width: '100%', gap: 12, marginBottom: 20 }}>
              {userExistingProfiles.map((p) => {
                const isCurrentActive = proProfile?.id === p.id;
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.existingProfilePreview,
                      isCurrentActive && { borderColor: '#A855F7', borderWidth: 2, backgroundColor: 'rgba(168,85,247,0.08)' },
                    ]}
                  >
                    {p.photoUrl ? (
                      <Image source={{ uri: p.photoUrl }} style={styles.previewAvatar} />
                    ) : (
                      <View style={styles.previewAvatarPlaceholder}>
                        <User size={24} color="#A855F7" />
                      </View>
                    )}
                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.previewName}>{p.name}</Text>
                        {isCurrentActive && (
                          <View style={{ backgroundColor: '#A855F7', borderRadius: 8, paddingHorizontal: 6, paddingVertical: 2 }}>
                            <Text style={{ color: '#FFF', fontSize: 10, fontWeight: '800' }}>ACTIVE</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.previewCity}>
                        📍 {p.currentLocation?.city || 'Location'} • {p.experience || '1 year'} exp.
                      </Text>
                      <Text style={{ fontSize: 11, color: Colors.textMuted, marginTop: 2 }} numberOfLines={1}>
                        🛠️ {p.services?.length || 0} services registered
                      </Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 3 }}>
                        <Star size={13} color="#F59E0B" fill="#F59E0B" />
                        <Text style={styles.previewRating}>{(p.rating || 5.0).toFixed(1)} ({p.completedJobs || 0} jobs)</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={[styles.continueExistingBtn, { width: 'auto', paddingHorizontal: 14, paddingVertical: 10, marginBottom: 0 }]}
                      onPress={() => selectExistingProfile(p)}
                      activeOpacity={0.85}
                    >
                      <CheckCircle2 size={16} color="#FFFFFF" />
                      <Text style={[styles.continueExistingBtnText, { fontSize: 12 }]}>Select</Text>
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>

            {/* Action Buttons: Create New Profile */}
            <TouchableOpacity
              style={styles.createNewBtn}
              onPress={createNewProfile}
              activeOpacity={0.85}
            >
              <Plus size={16} color="#A855F7" />
              <Text style={styles.createNewBtnText}>Create New Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={{ alignSelf: 'center', marginTop: 16 }}
              onPress={async () => {
                await setRole(null);
                await clearRole();
                resetToChooseRole();
              }}
            >
              <Text style={{ color: Colors.textMuted, fontSize: 13, fontWeight: '600' }}>Exit Professional Mode</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  const handleAcceptRequest = async (req: BookingRequest) => {
    await respondToRequest(req.id, 'accepted');
    const targetUserId = req.userId || 'usr_default';
    await sendTargetedNotification(targetUserId, {
      type: 'booking',
      title: 'Appointment Accepted! 🎉',
      message: `Your booking for ${req.serviceTitle} with ${proProfile?.name || 'Professional'} has been accepted for ${req.scheduledDate} ${req.scheduledTime ? `at ${req.scheduledTime}` : ''}.`,
    });
    Alert.alert('✅ Appointment Accepted', `You have accepted the booking from ${req.userName}.`);
  };

  const handleRejectRequest = async (req: BookingRequest) => {
    await respondToRequest(req.id, 'rejected');
    const targetUserId = req.userId || 'usr_default';
    await sendTargetedNotification(targetUserId, {
      type: 'booking',
      title: 'Appointment Declined ❌',
      message: `Your booking request for ${req.serviceTitle} was declined by ${proProfile?.name || 'Professional'}.`,
    });
    Alert.alert('Request Declined', `You have declined the booking from ${req.userName}.`);
  };

  const handleMarkCompleted = async (req: BookingRequest) => {
    await respondToRequest(req.id, 'completed');
    const targetUserId = req.userId || 'usr_default';
    await sendTargetedNotification(targetUserId, {
      type: 'rating',
      title: 'Rate Your Professional ⭐',
      message: `${proProfile?.name || 'Professional'} completed your ${req.serviceTitle} work. Tap here to leave a rating!`,
      actionPayload: {
        proId: proProfile?.id,
        bookingId: req.id,
        proName: proProfile?.name,
      },
    });
    Alert.alert('✅ Job Marked Completed', `Job marked as completed. A rating notification has been sent to ${req.userName}.`);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshRequests();
    await refreshChats();
    setRefreshing(false);
  };

  const handlePickAvatarFromDevice = async () => {
    try {
      setUploadingAvatar(true);
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Please allow access to your photo library to upload a profile picture.',
        );
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });
      if (!result.canceled && result.assets.length > 0) {
        await updateProProfile({ photoUrl: result.assets[0].uri });
        setShowAvatarModal(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSelectDefaultAvatar = async (url: string) => {
    await updateProProfile({ photoUrl: url });
    setShowAvatarModal(false);
  };

  // ── Chat ──────────────────────────────────────────────────────────────────
  const openChat = async (request: BookingRequest) => {
    setChatBooking(request);
    const msgs = await professionalMarketplaceService.getChatsForBooking(request.id);
    setChatMessages(msgs);
    if (proProfile) {
      await professionalMarketplaceService.markChatsRead(request.id, proProfile.id);
      await refreshChats();
    }
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const closeChat = () => {
    setChatBooking(null);
    setChatMessages([]);
    setChatInput('');
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || !chatBooking) return;
    const text = chatInput.trim();
    setChatInput('');
    await sendMessage(chatBooking.id, text);
    const updated = await professionalMarketplaceService.getChatsForBooking(chatBooking.id);
    setChatMessages(updated);
    setTimeout(() => chatScrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleCallUser = async (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    try {
      await Linking.openURL(`tel:${clean}`);
    } catch {
      Alert.alert('Call', `Calling ${phone}`);
    }
  };

  const handleSmsUser = async (phone: string) => {
    const clean = phone.replace(/[^0-9+]/g, '');
    try {
      await Linking.openURL(`sms:${clean}`);
    } catch {
      Alert.alert('SMS', `Messaging ${phone}`);
    }
  };

  const handleEmailUser = async (email: string) => {
    try {
      await Linking.openURL(`mailto:${email}`);
    } catch {
      Alert.alert('Email', `Emailing ${email}`);
    }
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const pendingRequests = requests.filter((r) => r.status === 'pending');
  const acceptedRequests = requests.filter((r) => r.status === 'accepted');
  const completedRequests = requests.filter((r) => r.status === 'completed');
  const todaysJobs = acceptedRequests; // For demo, accepted = today's

  // Unique bookings that have chats
  const chatBookings = requests.filter(
    (r) => r.status === 'accepted' || r.status === 'completed',
  );

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning ☀️';
    if (h < 17) return 'Good Afternoon 🌤️';
    return 'Good Evening 🌙';
  };

  const formatDate = (iso: string) => {
    try {
      return new Date(iso).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch { return iso; }
  };

  // ── Onboarding (Profile Setup) ────────────────────────────────────────────
  if (showOnboarding) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" backgroundColor={Colors.background} />
        <View style={styles.onboardingHeader}>
          <Text style={styles.onboardingHeaderTitle}>👋 Welcome to FixNest Pro</Text>
          <TouchableOpacity
            onPress={async () => {
              const doExit = async () => {
                await setRole(null);
                await clearRole();
                resetToChooseRole();
              };

              if (Platform.OS === 'web') {
                const confirmed = window.confirm(
                  'Leave professional setup?\nYou will be taken back to the "How would you like to continue?" screen.',
                );
                if (confirmed) {
                  await doExit();
                }
                return;
              }

              Alert.alert(
                'Exit Professional Mode',
                'Leave professional setup? You will be taken back to the "How would you like to continue?" screen.',
                [
                  { text: 'Stay', style: 'cancel' },
                  {
                    text: 'Exit',
                    style: 'destructive',
                    onPress: doExit,
                  },
                ],
              );
            }}
          >
            <Text style={styles.exitProText}>✕ Exit</Text>
          </TouchableOpacity>
        </View>
        <ProfessionalProfileScreen isOnboarding onSaved={() => setShowOnboarding(false)} />
      </SafeAreaView>
    );
  }

  // ── Chat Modal ────────────────────────────────────────────────────────────
  const renderChatModal = () => {
    if (!chatBooking) return null;
    return (
      <Modal visible animationType="slide" onRequestClose={closeChat}>
        <SafeAreaView style={styles.chatSafe}>
          <StatusBar barStyle="light-content" />
          {/* Chat Header */}
          <View style={styles.chatHeader}>
            <TouchableOpacity onPress={closeChat} style={styles.chatBackBtn}>
              <ArrowLeft size={20} color={Colors.textPrimary} />
              <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '700', marginLeft: 4 }}>Back</Text>
            </TouchableOpacity>
            <View style={styles.chatHeaderInfo}>
              <Text style={styles.chatHeaderTitle} numberOfLines={1}>
                {chatBooking.serviceTitle}
              </Text>
              <Text style={styles.chatHeaderSub}>{chatBooking.userName}</Text>
            </View>
            {/* Contact Buttons */}
            <View style={styles.chatContacts}>
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: 'rgba(16,185,129,0.15)' }]}
                onPress={() => handleCallUser(chatBooking.userPhone)}
              >
                <Phone size={16} color={Colors.success} />
              </TouchableOpacity>
              {chatBooking.userEmail ? (
                <TouchableOpacity
                  style={[styles.contactBtn, { backgroundColor: 'rgba(59,130,246,0.15)' }]}
                  onPress={() => handleEmailUser(chatBooking.userEmail!)}
                >
                  <Mail size={16} color={Colors.primary} />
                </TouchableOpacity>
              ) : null}
              <TouchableOpacity
                style={[styles.contactBtn, { backgroundColor: 'rgba(245,158,11,0.15)' }]}
                onPress={() => handleSmsUser(chatBooking.userPhone)}
              >
                <MessageSquare size={16} color={Colors.warning} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Booking Info Banner */}
          <View style={styles.chatBookingBanner}>
            <MapPin size={13} color={Colors.textMuted} />
            <Text style={styles.chatBookingBannerText} numberOfLines={1}>
              {chatBooking.address}
            </Text>
            <View style={[
              styles.chatStatusBadge,
              { backgroundColor: chatBooking.status === 'accepted' ? `${Colors.success}22` : `${Colors.primary}22` }
            ]}>
              <Text style={[
                styles.chatStatusText,
                { color: chatBooking.status === 'accepted' ? Colors.success : Colors.primary }
              ]}>
                {chatBooking.status === 'accepted' ? '● Active' : '✓ Done'}
              </Text>
            </View>
          </View>

          {/* Messages */}
          <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            keyboardVerticalOffset={80}
          >
            <ScrollView
              ref={chatScrollRef}
              contentContainerStyle={styles.chatMessages}
              showsVerticalScrollIndicator={false}
              onContentSizeChange={() => chatScrollRef.current?.scrollToEnd({ animated: true })}
            >
              {chatMessages.length === 0 ? (
                <View style={styles.chatEmpty}>
                  <MessageSquare size={36} color={Colors.textMuted} />
                  <Text style={styles.chatEmptyText}>
                    Chat with {chatBooking.userName} about this booking
                  </Text>
                </View>
              ) : (
                chatMessages.map((msg) => {
                  const isMe = msg.senderType === 'professional';
                  const isSystem = msg.type === 'system';

                  if (isSystem) {
                    return (
                      <View key={msg.id} style={styles.systemMsgRow}>
                        <Text style={styles.systemMsg}>{msg.message}</Text>
                      </View>
                    );
                  }

                  return (
                    <View
                      key={msg.id}
                      style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowThem]}
                    >
                      <View style={[
                        styles.msgBubble,
                        isMe ? styles.msgBubbleMe : styles.msgBubbleThem,
                      ]}>
                        <Text style={[
                          styles.msgText,
                          isMe ? styles.msgTextMe : styles.msgTextThem,
                        ]}>
                          {msg.message}
                        </Text>
                        <Text style={[
                          styles.msgTime,
                          isMe ? { color: 'rgba(255,255,255,0.6)' } : { color: Colors.textMuted },
                        ]}>
                          {formatDate(msg.timestamp)}
                        </Text>
                      </View>
                    </View>
                  );
                })
              )}
              <View style={{ height: 20 }} />
            </ScrollView>

            {/* Input */}
            <View style={styles.chatInputRow}>
              <TextInput
                style={styles.chatInput}
                placeholder="Type a message…"
                placeholderTextColor={Colors.textMuted}
                value={chatInput}
                onChangeText={setChatInput}
                multiline
                returnKeyType="send"
                onSubmitEditing={handleSendMessage}
              />
              <TouchableOpacity
                style={[styles.sendBtn, !chatInput.trim() && { opacity: 0.4 }]}
                onPress={handleSendMessage}
                disabled={!chatInput.trim()}
              >
                <Send size={18} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    );
  };

  // ── Home Tab ──────────────────────────────────────────────────────────────
  const renderHomeTab = () => (
    <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.proHeader}>
        <View style={styles.proHeaderLeft}>
          <TouchableOpacity
            onPress={() => setShowAvatarModal(true)}
            style={{ position: 'relative' }}
            activeOpacity={0.85}
          >
            {proProfile?.photoUrl ? (
              <Image source={{ uri: proProfile.photoUrl }} style={styles.proAvatar} />
            ) : (
              <View style={styles.proAvatarPlaceholder}>
                <User size={22} color={PURPLE} />
              </View>
            )}
            {/* Small camera badge */}
            <View style={styles.proAvatarCameraBadge}>
              <Upload size={9} color="#fff" />
            </View>
          </TouchableOpacity>
          <View>
            <Text style={styles.proGreeting}>{getGreeting()}</Text>
            <Text style={styles.proName} numberOfLines={1}>
              {proProfile?.name || 'Professional'}
            </Text>
          </View>
        </View>

        <View style={styles.proHeaderRight}>
          {/* Availability toggle */}
          <TouchableOpacity
            style={[
              styles.availToggle,
              { backgroundColor: proProfile?.availability ? `${Colors.success}22` : `${Colors.error}18` },
            ]}
            onPress={async () => {
              if (!proProfile) return;
              await updateProProfile({ availability: !proProfile.availability });
            }}
          >
            <View style={[
              styles.availDot,
              { backgroundColor: proProfile?.availability ? Colors.success : Colors.error },
            ]} />
            <Text style={[
              styles.availText,
              { color: proProfile?.availability ? Colors.success : Colors.error },
            ]}>
              {proProfile?.availability ? 'Online' : 'Offline'}
            </Text>
          </TouchableOpacity>

          {userExistingProfiles.length > 0 && (
            <TouchableOpacity
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                gap: 4,
                backgroundColor: 'rgba(168,85,247,0.12)',
                paddingHorizontal: 10,
                paddingVertical: 7,
                borderRadius: 20,
                borderWidth: 1,
                borderColor: 'rgba(168,85,247,0.3)',
              }}
              onPress={() => setShowProfileChoiceModal(true)}
              activeOpacity={0.8}
            >
              <User size={13} color="#A855F7" />
              <Text style={{ fontSize: 11, fontWeight: '700', color: '#A855F7' }}>Profiles ({userExistingProfiles.length})</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={handleRefresh} style={styles.refreshBtn}>
            <RefreshCw size={18} color={Colors.textMuted} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statBig}>{pendingRequests.length}</Text>
          <Text style={styles.statSmall}>New Requests</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statBig, { color: Colors.success }]}>{todaysJobs.length}</Text>
          <Text style={styles.statSmall}>Today's Jobs</Text>
        </View>
        <View style={styles.statCard}>
          <Star size={16} color={Colors.warning} fill={Colors.warning} />
          <Text style={[styles.statBig, { color: Colors.warning }]}>
            {(proProfile?.rating ?? 0).toFixed(1)}
          </Text>
          <Text style={styles.statSmall}>Rating</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statBig}>{proProfile?.completedJobs ?? 0}</Text>
          <Text style={styles.statSmall}>Total Jobs</Text>
        </View>
      </View>

      {/* Services Badge Row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.servicesScroll}>
        {(proProfile?.services || []).slice(0, 8).map((sid) => {
          const { HOUSEHOLD_SERVICES: SVCS } = require('../../constants/services');
          const svc = SVCS.find((s: any) => s.id === sid);
          if (!svc) return null;
          return (
            <View key={sid} style={styles.servicePill}>
              <Text style={styles.servicePillText}>{svc.title}</Text>
            </View>
          );
        })}
        {(proProfile?.services || []).length > 8 && (
          <View style={[styles.servicePill, { backgroundColor: `${PURPLE}22` }]}>
            <Text style={[styles.servicePillText, { color: PURPLE }]}>
              +{(proProfile?.services || []).length - 8} more
            </Text>
          </View>
        )}
      </ScrollView>

      {/* New Requests */}
      <View style={styles.sectionContainer}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>New Requests</Text>
          {pendingRequests.length > 0 && (
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{pendingRequests.length}</Text>
            </View>
          )}
        </View>

        {pendingRequests.length === 0 ? (
          <View style={styles.emptyBox}>
            <Briefcase size={30} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No new requests</Text>
            <Text style={styles.emptySub}>
              Make sure your availability is ON and your profile is complete to receive bookings.
            </Text>
          </View>
        ) : (
          pendingRequests.map((req) => (
            <BookingRequestCard
              key={req.id}
              request={req}
              onAccept={() => handleAcceptRequest(req)}
              onReject={() => handleRejectRequest(req)}
              onOpenChat={openChat}
            />
          ))
        )}
      </View>

      {/* Today's Jobs */}
      {todaysJobs.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Today's Active Jobs</Text>
          {todaysJobs.map((req) => (
            <BookingRequestCard
              key={req.id}
              request={req}
              onAccept={() => {}}
              onReject={() => {}}
              onOpenChat={openChat}
              showActions={false}
            />
          ))}
        </View>
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );

  // ── Jobs Tab ──────────────────────────────────────────────────────────────
  const renderJobsTab = () => (
    <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>My Jobs</Text>

      {/* Active */}
      {acceptedRequests.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Active Jobs ({acceptedRequests.length})</Text>
          {acceptedRequests.map((req) => (
            <BookingRequestCard
              key={req.id}
              request={req}
              onAccept={() => {}}
              onReject={(id) => {
                Alert.alert(
                  'Mark Completed?',
                  'Mark this job as completed?',
                  [
                    { text: 'Cancel' },
                    { text: 'Mark Done', onPress: () => handleMarkCompleted(req) },
                  ],
                );
              }}
              onOpenChat={openChat}
              showActions={false}
            />
          ))}
        </View>
      )}

      {/* Completed */}
      {completedRequests.length > 0 && (
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Completed ({completedRequests.length})</Text>
          {completedRequests.map((req) => (
            <BookingRequestCard
              key={req.id}
              request={req}
              onAccept={() => {}}
              onReject={() => {}}
              showActions={false}
            />
          ))}
        </View>
      )}

      {acceptedRequests.length === 0 && completedRequests.length === 0 && (
        <View style={styles.emptyBox}>
          <CheckCircle2 size={44} color={Colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>No jobs yet</Text>
          <Text style={styles.emptySub}>
            Accept booking requests to start your first job.
          </Text>
        </View>
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );

  // ── Messages Tab ──────────────────────────────────────────────────────────
  const renderMessagesTab = () => (
    <ScrollView contentContainerStyle={styles.tabScroll} showsVerticalScrollIndicator={false}>
      <Text style={styles.tabTitle}>Messages</Text>

      {chatBookings.length === 0 ? (
        <View style={styles.emptyBox}>
          <MessageSquare size={44} color={Colors.textMuted} style={{ opacity: 0.5 }} />
          <Text style={styles.emptyTitle}>No conversations yet</Text>
          <Text style={styles.emptySub}>
            Chats will appear here after you accept a booking request.
          </Text>
        </View>
      ) : (
        chatBookings.map((booking) => {
          const bookingChats = chats.filter((c) => c.bookingId === booking.id);
          const lastMsg = bookingChats[bookingChats.length - 1];
          const unread = bookingChats.filter(
            (m) => !m.read && m.senderType === 'user',
          ).length;

          return (
            <TouchableOpacity
              key={booking.id}
              style={styles.chatListItem}
              onPress={() => openChat(booking)}
              activeOpacity={0.8}
            >
              <View style={styles.chatListAvatar}>
                <User size={20} color={PURPLE} />
              </View>
              <View style={styles.chatListContent}>
                <View style={styles.chatListTop}>
                  <Text style={styles.chatListName}>{booking.userName}</Text>
                  {lastMsg && (
                    <Text style={styles.chatListTime}>
                      {formatDate(lastMsg.timestamp)}
                    </Text>
                  )}
                </View>
                <Text style={styles.chatListService} numberOfLines={1}>
                  📋 {booking.serviceTitle}
                </Text>
                {lastMsg && (
                  <Text style={styles.chatListPreview} numberOfLines={1}>
                    {lastMsg.senderType === 'professional' ? 'You: ' : ''}{lastMsg.message}
                  </Text>
                )}
              </View>
              {unread > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unread}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })
      )}

      <View style={{ height: 110 }} />
    </ScrollView>
  );

  // ── Profile Tab ───────────────────────────────────────────────────────────
  const renderProfileTab = () => (
    <View style={{ flex: 1 }}>
      <View style={styles.profileTabHeader}>
        <Text style={styles.profileTabTitle}>My Profile</Text>
      </View>
      {/* Exit Professional Mode button is inside ProfessionalProfileScreen scroll */}
      <ProfessionalProfileScreen />
    </View>
  );

  if (!proProfile) {
    return <ProfessionalProfileScreen isOnboarding={true} />;
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor={Colors.background} />

      {/* Tab Content */}
      {activeTab === 'Home' && renderHomeTab()}
      {activeTab === 'Jobs' && renderJobsTab()}
      {activeTab === 'Messages' && renderMessagesTab()}
      {activeTab === 'Profile' && renderProfileTab()}

      {/* Bottom Nav */}
      <ProfessionalBottomTabBar
        activeTab={activeTab}
        onTabPress={setActiveTab}
        unreadMessages={unreadMessages}
      />

      {/* Avatar Picker Modal */}
      <Modal
        visible={showAvatarModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAvatarModal(false)}
      >
        <TouchableOpacity
          style={styles.avatarModalOverlay}
          activeOpacity={1}
          onPress={() => setShowAvatarModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.avatarModalSheet}
            onPress={() => {}}
          >
            <View style={styles.avatarModalHandle} />
            <Text style={styles.avatarModalTitle}>Update Profile Photo</Text>
            <Text style={styles.avatarModalSub}>Choose a default picture or upload from your device</Text>

            {/* Upload from device */}
            <TouchableOpacity
              style={styles.avatarUploadFromDeviceBtn}
              onPress={handlePickAvatarFromDevice}
              disabled={uploadingAvatar}
              activeOpacity={0.8}
            >
              <View style={styles.avatarUploadIconWrap}>
                <Upload size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.avatarUploadFromDeviceTitle}>Upload from Device</Text>
                <Text style={styles.avatarUploadFromDeviceSub}>Choose a photo from your gallery</Text>
              </View>
              {uploadingAvatar && <ActivityIndicator size="small" color={PURPLE} />}
            </TouchableOpacity>

            <Text style={styles.avatarDefaultsLabel}>Or pick a default avatar</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.avatarDefaultsScroll}
            >
              {AVATAR_DEFAULTS.map((url, i) => {
                const isSelected = proProfile?.photoUrl === url;
                return (
                  <TouchableOpacity
                    key={i}
                    onPress={() => handleSelectDefaultAvatar(url)}
                    style={[styles.avatarDefaultItem, isSelected && styles.avatarDefaultItemSelected]}
                    activeOpacity={0.8}
                  >
                    <Image source={{ uri: url }} style={styles.avatarDefaultImg} />
                    {isSelected && (
                      <View style={styles.avatarDefaultCheck}>
                        <Check size={12} color="#fff" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Chat Modal */}
      {renderChatModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },

  // Onboarding
  onboardingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 12 : 6,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  onboardingHeaderTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  switchRoleText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Pro avatar camera badge
  proAvatarCameraBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },

  // Avatar picker modal
  avatarModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  avatarModalSheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 12,
    paddingBottom: 36,
    paddingHorizontal: 20,
  },
  avatarModalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    alignSelf: 'center',
    marginBottom: 16,
  },
  avatarModalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  avatarModalSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 18,
    lineHeight: 18,
  },
  avatarUploadFromDeviceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: `${PURPLE}14`,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: `${PURPLE}40`,
    padding: 14,
    marginBottom: 18,
  },
  avatarUploadIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  avatarUploadFromDeviceTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  avatarUploadFromDeviceSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  avatarDefaultsLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  avatarDefaultsScroll: {
    gap: 10,
    paddingRight: 10,
  },
  avatarDefaultItem: {
    position: 'relative',
    borderRadius: 36,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarDefaultItemSelected: {
    borderColor: PURPLE,
  },
  avatarDefaultImg: {
    width: 64,
    height: 64,
    borderRadius: 32,
  },
  avatarDefaultCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Pro Header
  proHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  proHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  proAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: PURPLE,
  },
  proAvatarPlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${PURPLE}20`,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: PURPLE,
  },
  proGreeting: {
    fontSize: 11,
    color: Colors.textSecondary,
  },
  proName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
    maxWidth: 160,
  },
  proHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  availToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  availDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  availText: {
    fontSize: 12,
    fontWeight: '700',
  },
  refreshBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 2,
  },
  statBig: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statSmall: {
    fontSize: 9,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 12,
  },

  // Services scroll
  servicesScroll: {
    marginBottom: 16,
  },
  servicePill: {
    backgroundColor: `${PURPLE}15`,
    borderWidth: 1,
    borderColor: `${PURPLE}35`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginRight: 8,
  },
  servicePillText: {
    fontSize: 11,
    color: PURPLE,
    fontWeight: '600',
  },

  // Tab common
  tabScroll: {
    padding: 20,
  },
  tabTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 16,
  },

  // Sections
  sectionContainer: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  countBadge: {
    backgroundColor: Colors.warning,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.background,
  },

  // Empty
  emptyBox: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    padding: 28,
    gap: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },

  // Chat list
  chatListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  chatListAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${PURPLE}18`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatListContent: {
    flex: 1,
    gap: 3,
  },
  chatListTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatListName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chatListTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  chatListService: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '500',
  },
  chatListPreview: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  unreadBadge: {
    backgroundColor: PURPLE,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  unreadBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Profile tab header
  profileTabHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 10 : 4,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  profileTabTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },

  // Exit pro text (onboarding header)
  exitProText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '600',
  },

  // Exit professional mode banner
  exitProBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: 'rgba(239,68,68,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.25)',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  exitProBannerIcon: {
    fontSize: 22,
  },
  exitProBannerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.error,
    marginBottom: 2,
  },
  exitProBannerSub: {
    fontSize: 11,
    color: Colors.textMuted,
    lineHeight: 15,
  },

  // Old switchRole styles kept for compat
  switchRoleBtn: {
    backgroundColor: 'rgba(59,130,246,0.12)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  switchRoleBtnText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '600',
  },

  // Chat Modal
  chatSafe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  chatHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'android' ? 14 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 10,
    backgroundColor: Colors.surface,
  },
  chatBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surfaceElevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatHeaderInfo: {
    flex: 1,
  },
  chatHeaderTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  chatHeaderSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 1,
  },
  chatContacts: {
    flexDirection: 'row',
    gap: 8,
  },
  contactBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chatBookingBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chatBookingBannerText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textMuted,
  },
  chatStatusBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chatStatusText: {
    fontSize: 10,
    fontWeight: '700',
  },
  chatMessages: {
    padding: 16,
  },
  chatEmpty: {
    alignItems: 'center',
    paddingTop: 60,
    gap: 10,
  },
  chatEmptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    textAlign: 'center',
  },
  systemMsgRow: {
    alignItems: 'center',
    marginVertical: 10,
    paddingHorizontal: 20,
  },
  systemMsg: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  msgRow: {
    marginBottom: 8,
  },
  msgRowMe: {
    alignItems: 'flex-end',
  },
  msgRowThem: {
    alignItems: 'flex-start',
  },
  msgBubble: {
    maxWidth: '78%',
    borderRadius: 16,
    padding: 12,
  },
  msgBubbleMe: {
    backgroundColor: PURPLE,
    borderBottomRightRadius: 4,
  },
  msgBubbleThem: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#FFFFFF',
  },
  msgTextThem: {
    color: Colors.textPrimary,
  },
  msgTime: {
    fontSize: 10,
    marginTop: 4,
  },
  chatInputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  // Existing Profile Choice Card Styles
  choiceCard: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 24,
    alignItems: 'center',
  },
  choiceHeaderIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  choiceTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.textPrimary,
    textAlign: 'center',
    marginBottom: 6,
  },
  choiceSub: {
    fontSize: 13,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 20,
  },
  existingProfilePreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
    padding: 14,
    width: '100%',
    marginBottom: 20,
  },
  previewAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: '#A855F7',
  },
  previewAvatarPlaceholder: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(168,85,247,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  previewCity: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  previewRating: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  continueExistingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: PURPLE,
    borderRadius: 14,
    paddingVertical: 14,
    width: '100%',
    marginBottom: 10,
  },
  continueExistingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  createNewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(168,85,247,0.12)',
    borderRadius: 14,
    paddingVertical: 13,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(168,85,247,0.3)',
  },
  createNewBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#A855F7',
  },
});
