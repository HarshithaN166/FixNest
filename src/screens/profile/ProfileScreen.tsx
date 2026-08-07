import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useProfessional } from '../../context/ProfessionalContext';
import { resetToChooseRole } from '../../navigation/NavigationService';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import {
  profileService,
  ExtendedProfile,
  HomeProperty,
  AddressItem,
  SavedPro,
  PaymentMethodItem,
  BookingRecord,
  NotificationSettings,
  CUTE_ANIMAL_AVATARS,
  DEFAULT_CUTE_AVATAR,
} from '../../services/profileService';
import {
  User,
  ArrowLeft,
  Mail,
  Phone,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Home as HomeIcon,
  Plus,
  Calendar,
  Heart,
  Star,
  Activity,
  MapPin,
  Briefcase,
  CreditCard,
  Smartphone,
  QrCode,
  Bell,
  Lock,
  SmartphoneNfc,
  ShieldAlert,
  Download,
  Trash2,
  HelpCircle,
  MessageSquare,
  Info,
  ChevronRight,
  LogOut,
  X,
  Camera,
  Globe,
  ChevronDown,
  ChevronUp,
  Check,
  Share2,
  StarHalf,
  Bug,
  Send,
  Layers,
  FileText,
  Key,
  Shield,
  Eye,
  EyeOff,
} from 'lucide-react-native';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'United States', flag: '🇺🇸' },
  { code: '+44', country: 'United Kingdom', flag: '🇬🇧' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
];

interface ProfileScreenProps {
  onBack?: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { user, isGuest, logout, updateUser } = useAuth();
  const { clearRole } = useProfessional();

  // Data States
  const [profileData, setProfileData] = useState<ExtendedProfile | null>(null);
  const [homes, setHomes] = useState<HomeProperty[]>([]);
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [savedPros, setSavedPros] = useState<SavedPro[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethodItem[]>([]);
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [settings, setSettings] = useState<NotificationSettings>({
    pushNotif: true,
    emailNotif: true,
    smsNotif: false,
    remindersNotif: true,
    offersNotif: false,
  });

  const [imageError, setImageError] = useState(false);

  // Modals & UI States
  const [editProfileModal, setEditProfileModal] = useState(false);
  const [avatarMenuModal, setAvatarMenuModal] = useState(false);
  const [customAvatarUrlInput, setCustomAvatarUrlInput] = useState('');

  const [homeModalVisible, setHomeModalVisible] = useState(false);
  const [editingHome, setEditingHome] = useState<HomeProperty | null>(null);

  const [addressModalVisible, setAddressModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);

  const [paymentModalVisible, setPaymentModalVisible] = useState(false);
  const [editingPayment, setEditingPayment] = useState<PaymentMethodItem | null>(null);

  const [bookingDetailsModal, setBookingDetailsModal] = useState<BookingRecord | null>(null);
  const [bookingTab, setBookingTab] = useState<'Upcoming' | 'Completed' | 'Cancelled'>('Completed');

  const [logoutModal, setLogoutModal] = useState(false);
  const [deleteAccountModal, setDeleteAccountModal] = useState(false);
  const [deleteInputText, setDeleteInputText] = useState('');

  const [changePasswordModal, setChangePasswordModal] = useState(false);
  const [newPasswordInput, setNewPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [manageDevicesModal, setManageDevicesModal] = useState(false);
  const [tfaModal, setTfaModal] = useState(false);
  const [countryPickerModal, setCountryPickerModal] = useState(false);
  const [supportModal, setSupportModal] = useState(false);
  const [reportBugModal, setReportBugModal] = useState(false);
  const [policyModal, setPolicyModal] = useState<'privacy' | 'terms' | null>(null);
  const [rateModal, setRateModal] = useState(false);
  const [ratingStars, setRatingStars] = useState(5);
  const [ratingFeedback, setRatingFeedback] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [shareModal, setShareModal] = useState(false);

  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  const handleOpenRateModal = async () => {
    setRateModal(true);
    if (user?.id) {
      const existing = await profileService.getUserAppRating(user.id);
      if (existing) {
        setRatingStars(existing.rating);
        setRatingFeedback(existing.feedback || '');
      }
    }
  };

  const handleSaveRating = async () => {
    if (!user?.id) {
      Alert.alert('Authentication Required', 'Please log in to submit a rating.');
      return;
    }
    setSubmittingRating(true);
    try {
      const ok = await profileService.submitAppRating(user.id, ratingStars, ratingFeedback);
      if (ok) {
        Alert.alert('Thank You!', 'Thank you for your feedback.');
        setRateModal(false);
      } else {
        Alert.alert('Rating Error', 'Failed to submit rating. Please try again.');
      }
    } catch (err) {
      Alert.alert('Rating Error', 'Failed to submit rating. Please try again.');
    } finally {
      setSubmittingRating(false);
    }
  };

  // Edit Profile Form Inputs
  const [editFullName, setEditFullName] = useState(user?.fullName || '');
  const [editUsername, setEditUsername] = useState('');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [selectedCountry, setSelectedCountry] = useState(COUNTRY_CODES[0]);
  const [editPhoneNumber, setEditPhoneNumber] = useState('');
  const [editDob, setEditDob] = useState('');
  const [editGender, setEditGender] = useState('Prefer not to say');

  // Home Form Inputs
  const [homeNameInput, setHomeNameInput] = useState('');
  const [homeTypeInput, setHomeTypeInput] = useState('Apartment');
  const [homeAddrInput, setHomeAddrInput] = useState('');
  const [homeCityInput, setHomeCityInput] = useState('');
  const [homeStateInput, setHomeStateInput] = useState('');
  const [homeCountryInput, setHomeCountryInput] = useState('');
  const [homePincodeInput, setHomePincodeInput] = useState('');
  const [homeMembersInput, setHomeMembersInput] = useState('1');
  const [homeDefaultToggle, setHomeDefaultToggle] = useState(false);

  // Address Form Inputs
  const [addrTypeInput, setAddrTypeInput] = useState('Home');
  const [addrTitleInput, setAddrTitleInput] = useState('');
  const [addrFullInput, setAddrFullInput] = useState('');
  const [addrLandmarkInput, setAddrLandmarkInput] = useState('');
  const [addrCityInput, setAddrCityInput] = useState('');
  const [addrStateInput, setAddrStateInput] = useState('');
  const [addrPincodeInput, setAddrPincodeInput] = useState('');
  const [addrDefaultToggle, setAddrDefaultToggle] = useState(false);

  // Payment Form Inputs
  const [payTypeInput, setPayTypeInput] = useState('UPI');
  const [payProviderInput, setPayProviderInput] = useState('Google Pay');
  const [payAccountInput, setPayAccountInput] = useState('');
  const [payDefaultToggle, setPayDefaultToggle] = useState(false);

  // Bug Report Form Inputs
  const [bugTitle, setBugTitle] = useState('');
  const [bugDesc, setBugDesc] = useState('');

  useEffect(() => {
    if (user?.id) {
      loadAllUserData(user.id);
    }
  }, [user]);

  const loadAllUserData = async (userId: string) => {
    const [prof, fetchedHomes, fetchedAddresses, fetchedPros, fetchedPayments, fetchedBookings, fetchedSettings] =
      await Promise.all([
        profileService.getFullProfile(userId),
        profileService.getHomes(userId),
        profileService.getAddresses(userId),
        profileService.getSavedProfessionals(userId),
        profileService.getPaymentMethods(userId),
        profileService.getBookings(userId),
        profileService.getSettings(userId),
      ]);

    if (prof) {
      setProfileData(prof);
      setEditFullName(prof.fullName);
      setEditUsername(prof.username);
      setEditEmail(prof.email || user?.email || '');
      setEditPhoneNumber(prof.phone);
      setEditDob(prof.dob);
      setEditGender(prof.gender || 'Prefer not to say');
    } else {
      setEditFullName(user?.fullName || '');
      setEditEmail(user?.email || '');
      setEditPhoneNumber(user?.phone || '');
    }

    setHomes(fetchedHomes);
    setAddresses(fetchedAddresses);
    setSavedPros(fetchedPros);
    setPaymentMethods(fetchedPayments);
    setBookings(fetchedBookings);
    setSettings(fetchedSettings);
  };

  // 1. Profile Picture Handlers
  const handleUpdateAvatar = async (url: string | null) => {
    setImageError(false);
    if (user) {
      user.avatarUrl = url || undefined;
    }
    if (profileData) {
      profileData.avatarUrl = url;
    }
    await profileService.updateFullProfile(user?.id || 'guest', { avatarUrl: url });
    setAvatarMenuModal(false);
    Alert.alert('Profile Picture', url ? 'Profile picture updated successfully.' : 'Profile picture reset to default cute animal avatar.');
  };

  const handleCustomAvatarUrlSubmit = async () => {
    if (!customAvatarUrlInput) {
      Alert.alert('Error', 'Please enter a valid image URL.');
      return;
    }
    await handleUpdateAvatar(customAvatarUrlInput);
    setCustomAvatarUrlInput('');
  };

  const handleFileUploadWeb = (event: any) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const result = e.target?.result as string;
        await handleUpdateAvatar(result);
      };
      reader.readAsDataURL(file);
    }
  };

  // 2. Edit Profile Handler
  const handleSaveProfile = async () => {
    const fullPhone = editPhoneNumber ? `${selectedCountry.code} ${editPhoneNumber}` : '';
    const updatedProf: ExtendedProfile = {
      fullName: editFullName,
      username: editUsername,
      email: editEmail,
      phone: fullPhone,
      dob: editDob,
      gender: editGender,
      avatarUrl: profileData?.avatarUrl || null,
    };
    setProfileData(updatedProf);
    updateUser({
      fullName: editFullName || editUsername || 'User',
      phone: fullPhone,
      email: editEmail,
    });
    await profileService.updateFullProfile(user?.id || 'usr_default', updatedProf);
    setEditProfileModal(false);
    Alert.alert('Profile Saved', 'Your profile details have been saved successfully.');
  };

  // 3. My Home Handlers
  const openAddHomeModal = () => {
    setEditingHome(null);
    setHomeNameInput('');
    setHomeTypeInput('Apartment');
    setHomeAddrInput('');
    setHomeCityInput('');
    setHomeStateInput('');
    setHomeCountryInput('');
    setHomePincodeInput('');
    setHomeMembersInput('1');
    setHomeDefaultToggle(homes.length === 0);
    setHomeModalVisible(true);
  };

  const openEditHomeModal = (h: HomeProperty) => {
    setEditingHome(h);
    setHomeNameInput(h.homeName);
    setHomeTypeInput(h.propertyType);
    setHomeAddrInput(h.address || '');
    setHomeCityInput(h.city || '');
    setHomeStateInput(h.state || '');
    setHomeCountryInput(h.country || '');
    setHomePincodeInput(h.pincode || '');
    setHomeMembersInput(String(h.familyMembers));
    setHomeDefaultToggle(h.isDefault);
    setHomeModalVisible(true);
  };

  const handleSaveHome = async () => {
    if (!homeNameInput) {
      Alert.alert('Error', 'Please enter a home name.');
      return;
    }

    if (editingHome) {
      const updated: HomeProperty = {
        id: editingHome.id,
        homeName: homeNameInput,
        propertyType: homeTypeInput,
        address: homeAddrInput,
        city: homeCityInput,
        state: homeStateInput,
        country: homeCountryInput,
        pincode: homePincodeInput,
        familyMembers: parseInt(homeMembersInput) || 1,
        isDefault: homeDefaultToggle,
      };
      await profileService.updateHome(user?.id || 'guest', updated);
      if (homeDefaultToggle) {
        setHomes(homes.map((h) => ({ ...h, isDefault: h.id === editingHome.id })));
      } else {
        setHomes(homes.map((h) => (h.id === editingHome.id ? updated : h)));
      }
    } else {
      const created = await profileService.addHome(user?.id || 'guest', {
        homeName: homeNameInput,
        propertyType: homeTypeInput,
        address: homeAddrInput,
        city: homeCityInput,
        state: homeStateInput,
        country: homeCountryInput,
        pincode: homePincodeInput,
        familyMembers: parseInt(homeMembersInput) || 1,
        isDefault: homeDefaultToggle,
      });
      if (homeDefaultToggle) {
        setHomes([...homes.map((h) => ({ ...h, isDefault: false })), created]);
      } else {
        setHomes([...homes, created]);
      }
    }
    setHomeModalVisible(false);
    Alert.alert('Success', 'Home saved successfully.');
  };

  const handleDeleteHome = async (homeId: string) => {
    await profileService.deleteHome(user?.id || 'guest', homeId);
    setHomes(homes.filter((h) => h.id !== homeId));
    Alert.alert('Deleted', 'Home removed successfully.');
  };

  const handleSetDefaultHome = async (homeId: string) => {
    await profileService.setDefaultHome(user?.id || 'guest', homeId);
    setHomes(homes.map((h) => ({ ...h, isDefault: h.id === homeId })));
  };

  // 4. Saved Addresses Handlers
  const openAddAddressModal = () => {
    setEditingAddress(null);
    setAddrTypeInput('Home');
    setAddrTitleInput('');
    setAddrFullInput('');
    setAddrLandmarkInput('');
    setAddrCityInput('');
    setAddrStateInput('');
    setAddrPincodeInput('');
    setAddrDefaultToggle(addresses.length === 0);
    setAddressModalVisible(true);
  };

  const openEditAddressModal = (a: AddressItem) => {
    setEditingAddress(a);
    setAddrTypeInput(a.addressType);
    setAddrTitleInput(a.title);
    setAddrFullInput(a.fullAddress);
    setAddrLandmarkInput(a.landmark || '');
    setAddrCityInput(a.city);
    setAddrStateInput(a.state || '');
    setAddrPincodeInput(a.pincode || '');
    setAddrDefaultToggle(a.isDefault);
    setAddressModalVisible(true);
  };

  const handleSaveAddress = async () => {
    if (!addrFullInput) {
      Alert.alert('Error', 'Please enter complete address.');
      return;
    }

    if (editingAddress) {
      const updated: AddressItem = {
        id: editingAddress.id,
        addressType: addrTypeInput,
        title: addrTitleInput || addrTypeInput,
        fullAddress: addrFullInput,
        landmark: addrLandmarkInput,
        city: addrCityInput,
        state: addrStateInput,
        pincode: addrPincodeInput,
        isDefault: addrDefaultToggle,
      };
      await profileService.updateAddress(user?.id || 'guest', updated);
      if (addrDefaultToggle) {
        setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === editingAddress.id })));
      } else {
        setAddresses(addresses.map((a) => (a.id === editingAddress.id ? updated : a)));
      }
    } else {
      const created = await profileService.addAddress(user?.id || 'guest', {
        addressType: addrTypeInput,
        title: addrTitleInput || addrTypeInput,
        fullAddress: addrFullInput,
        landmark: addrLandmarkInput,
        city: addrCityInput,
        state: addrStateInput,
        pincode: addrPincodeInput,
        isDefault: addrDefaultToggle,
      });
      if (addrDefaultToggle) {
        setAddresses([...addresses.map((a) => ({ ...a, isDefault: false })), created]);
      } else {
        setAddresses([...addresses, created]);
      }
    }
    setAddressModalVisible(false);
    Alert.alert('Success', 'Address saved successfully.');
  };

  const handleDeleteAddress = async (addrId: string) => {
    await profileService.deleteAddress(user?.id || 'guest', addrId);
    setAddresses(addresses.filter((a) => a.id !== addrId));
    Alert.alert('Deleted', 'Address removed successfully.');
  };

  const handleSetDefaultAddress = async (addrId: string) => {
    await profileService.setDefaultAddress(user?.id || 'guest', addrId);
    setAddresses(addresses.map((a) => ({ ...a, isDefault: a.id === addrId })));
  };

  // 7. Payment Methods Handlers
  const openAddPaymentModal = () => {
    setEditingPayment(null);
    setPayTypeInput('UPI');
    setPayProviderInput('Google Pay');
    setPayAccountInput('');
    setPayDefaultToggle(paymentMethods.length === 0);
    setPaymentModalVisible(true);
  };

  const handleSavePayment = async () => {
    if (!payAccountInput) {
      Alert.alert('Error', 'Please enter account details.');
      return;
    }
    const created = await profileService.addPaymentMethod(user?.id || 'guest', {
      methodType: payTypeInput,
      providerName: payProviderInput,
      accountIdentifier: payAccountInput,
      isDefault: payDefaultToggle,
    });
    if (payDefaultToggle) {
      setPaymentMethods([...paymentMethods.map((p) => ({ ...p, isDefault: false })), created]);
    } else {
      setPaymentMethods([...paymentMethods, created]);
    }
    setPaymentModalVisible(false);
    Alert.alert('Success', 'Payment method added securely.');
  };

  const handleDeletePayment = async (payId: string) => {
    await profileService.deletePaymentMethod(user?.id || 'guest', payId);
    setPaymentMethods(paymentMethods.filter((p) => p.id !== payId));
    Alert.alert('Deleted', 'Payment method removed.');
  };

  const handleSetDefaultPayment = async (payId: string) => {
    await profileService.setDefaultPaymentMethod(user?.id || 'guest', payId);
    setPaymentMethods(paymentMethods.map((p) => ({ ...p, isDefault: p.id === payId })));
  };

  // 8. Notification Toggles Handler
  const handleToggleSetting = async (key: keyof NotificationSettings) => {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    await profileService.saveSettings(user?.id || 'guest', updated);
  };

  // 10. Privacy & Security Handlers
  const handlePasswordChange = async () => {
    if (!newPasswordInput || newPasswordInput.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters.');
      return;
    }
    try {
      await profileService.changePassword(newPasswordInput);
      setNewPasswordInput('');
      setChangePasswordModal(false);
      Alert.alert('Success', 'Your password has been changed successfully.');
    } catch (err: any) {
      Alert.alert('Error', err.message || 'Failed to update password.');
    }
  };

  const handleDownloadData = async () => {
    await profileService.exportUserDataJSON(user?.id || 'guest', user?.email || 'user@fixnest.com');
    Alert.alert('Data Exported', 'A JSON file containing your profile, homes, addresses, bookings, and preferences has been downloaded.');
  };

  const handleDeleteAccountSubmit = async () => {
    if (deleteInputText.trim() !== 'DELETE') {
      Alert.alert('Error', 'Please type DELETE in capital letters to confirm account deletion.');
      return;
    }
    await profileService.deleteUserAccount(user?.id || 'guest');
    setDeleteAccountModal(false);
    logout();
    await clearRole();
    resetToChooseRole();
  };

  const defaultHome = homes.find((h) => h.isDefault) || homes[0];

  const getAddressIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'home':
        return <HomeIcon size={18} color={Colors.primary} />;
      case 'office':
      case 'work':
        return <Briefcase size={18} color={Colors.primary} />;
      default:
        return <MapPin size={18} color={Colors.primary} />;
    }
  };

  const faqs = [
    { q: 'How do I track my active technician?', a: 'You can view live GPS tracking in the Bookings tab once a technician is assigned.' },
    { q: 'What is FixNest Service Guarantee?', a: 'All repairs come with a 30-day free warranty and 100% money-back satisfaction guarantee.' },
    { q: 'How are cost estimates calculated?', a: 'FixNest AI analyzes your description and diagnostic images against localized verified rate cards.' },
  ];

  const filteredBookings = bookings.filter((b) => b.status === bookingTab);

  return (
    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
      {onBack && (
        <TouchableOpacity
          onPress={onBack}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            alignSelf: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.08)',
            paddingHorizontal: 12,
            paddingVertical: 8,
            borderRadius: 20,
            borderWidth: 1,
            borderColor: 'rgba(255, 255, 255, 0.12)',
            marginBottom: 12,
            gap: 6,
          }}
          activeOpacity={0.75}
        >
          <ArrowLeft size={18} color={Colors.textPrimary} />
          <Text style={{ color: Colors.textPrimary, fontSize: 13, fontWeight: '700' }}>Back to Home</Text>
        </TouchableOpacity>
      )}

      {/* 1. Header */}
      <View style={styles.headerCard}>
        <View style={styles.avatarWrapper}>
          <Image
            source={{
              uri:
                !imageError && (profileData?.avatarUrl || user?.avatarUrl)
                  ? profileData?.avatarUrl || user?.avatarUrl || DEFAULT_CUTE_AVATAR
                  : DEFAULT_CUTE_AVATAR,
            }}
            onError={() => setImageError(true)}
            style={styles.avatarImg}
          />
          <TouchableOpacity style={styles.editAvatarBtn} onPress={() => setAvatarMenuModal(true)}>
            <Camera size={14} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{profileData?.fullName || user?.fullName || 'Valued User'}</Text>
            <View style={styles.verifiedBadge}>
              <ShieldCheck size={14} color={Colors.primary} />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>

          <Text style={styles.userEmail}>{profileData?.email || user?.email || 'No email associated'}</Text>
          <Text style={styles.userPhone}>{profileData?.phone || user?.phone || 'No phone number added'}</Text>

          <TouchableOpacity style={styles.editProfileBtn} onPress={() => setEditProfileModal(true)}>
            <Edit3 size={14} color={Colors.primary} />
            <Text style={styles.editProfileBtnText}>Edit Profile</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* 2. My Home (Hero Section) */}
      <View style={styles.myHomeCard}>
        <View style={styles.homeGlow} />
        <View style={styles.homeCardHeader}>
          <View style={styles.homeBadgeRow}>
            <View style={styles.homeTypeBadge}>
              <HomeIcon size={14} color={Colors.primary} />
              <Text style={styles.homeTypeBadgeText}>{defaultHome ? defaultHome.propertyType : 'Primary Home'}</Text>
            </View>
            {defaultHome?.isDefault && (
              <View style={styles.defaultBadge}>
                <CheckCircle2 size={12} color={Colors.success} />
                <Text style={styles.defaultBadgeText}>DEFAULT</Text>
              </View>
            )}
          </View>
          <TouchableOpacity style={styles.addHomeBtn} onPress={openAddHomeModal}>
            <Plus size={14} color="#FFFFFF" />
            <Text style={styles.addHomeBtnText}>Add Home</Text>
          </TouchableOpacity>
        </View>

        {defaultHome ? (
          <>
            <Text style={styles.homeTitle}>{defaultHome.homeName}</Text>
            <Text style={styles.homeAddrSub}>
              {defaultHome.address ? `${defaultHome.address}, ${defaultHome.city}` : 'Primary Residence'}
            </Text>
            <View style={styles.homeMetaRow}>
              <Text style={styles.homeMetaText}>👨‍👩‍👧‍👦 {defaultHome.familyMembers} Family Members</Text>
              <TouchableOpacity onPress={() => openEditHomeModal(defaultHome)}>
                <Text style={styles.homeActionLink}>Edit</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDeleteHome(defaultHome.id)}>
                <Text style={[styles.homeActionLink, { color: Colors.error }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <View style={styles.emptyHomeHero}>
            <Text style={styles.emptyHomeTitle}>No home added yet.</Text>
            <Text style={styles.emptyHomeSub}>Add your primary residence to customize service bookings.</Text>
          </View>
        )}

        {homes.length > 1 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.homesScroll}>
            {homes.map((h) => (
              <TouchableOpacity
                key={h.id}
                style={[styles.miniHomePill, h.isDefault && styles.miniHomePillActive]}
                onPress={() => handleSetDefaultHome(h.id)}
              >
                <Text style={styles.miniHomeText}>{h.homeName}</Text>
                {h.isDefault && <Check size={12} color={Colors.primary} style={{ marginLeft: 4 }} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>

      {/* 3. Quick Stats (Dynamic Counts) */}
      <View style={styles.statsGrid}>
        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Calendar size={20} color={Colors.primary} />
          </View>
          <Text style={styles.statNum}>{bookings.length}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(245, 158, 11, 0.15)' }]}>
            <Heart size={20} color="#F59E0B" />
          </View>
          <Text style={styles.statNum}>{savedPros.length}</Text>
          <Text style={styles.statLabel}>Saved Pros</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <Star size={20} color={Colors.success} />
          </View>
          <Text style={styles.statNum}>0</Text>
          <Text style={styles.statLabel}>Reviews</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIconCircle, { backgroundColor: 'rgba(168, 85, 247, 0.15)' }]}>
            <Activity size={20} color="#A855F7" />
          </View>
          <Text style={styles.statNum}>{bookings.filter((b) => b.status === 'Upcoming').length}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>

      {/* 4. Saved Addresses */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <MapPin size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Saved Addresses</Text>
          </View>
          <TouchableOpacity style={styles.iconAddBtn} onPress={openAddAddressModal}>
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {addresses.length > 0 ? (
          addresses.map((a) => (
            <View key={a.id} style={styles.addressCard}>
              <View style={styles.addressHeader}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={styles.addrIconContainer}>{getAddressIcon(a.addressType)}</View>
                  <Text style={styles.addrTitle}>{a.title || a.addressType}</Text>
                </View>
                {a.isDefault && <Text style={styles.primaryBadgeText}>DEFAULT</Text>}
              </View>
              <Text style={styles.fullAddrText}>{a.fullAddress}</Text>
              <Text style={styles.cityText}>{a.city}</Text>

              <View style={styles.itemActionRow}>
                {!a.isDefault && (
                  <TouchableOpacity onPress={() => handleSetDefaultAddress(a.id)}>
                    <Text style={styles.itemActionText}>Set Default</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => openEditAddressModal(a)}>
                  <Text style={styles.itemActionText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteAddress(a.id)}>
                  <Text style={[styles.itemActionText, { color: Colors.error }]}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateBox}>
            <MapPin size={28} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No saved addresses.</Text>
            <Text style={styles.emptyStateSub}>Tap + to add your home or work address.</Text>
          </View>
        )}
      </View>

      {/* 5. My Bookings */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Briefcase size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>My Bookings</Text>
          </View>
        </View>

        <View style={styles.tabsRow}>
          {(['Upcoming', 'Completed', 'Cancelled'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              style={[styles.subTab, bookingTab === t && styles.subTabActive]}
              onPress={() => setBookingTab(t)}
            >
              <Text style={[styles.subTabText, bookingTab === t && styles.subTabTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {filteredBookings.length > 0 ? (
          filteredBookings.map((b) => (
            <TouchableOpacity key={b.id} style={styles.bookingItemCard} onPress={() => setBookingDetailsModal(b)}>
              <View style={styles.bookingTop}>
                <Text style={styles.bookingItemTitle}>{b.serviceTitle}</Text>
                <Text style={styles.bookingCost}>{b.amount}</Text>
              </View>
              <Text style={styles.bookingDateText}>{b.date}</Text>
              <View style={styles.bookingBottomRow}>
                <Text style={styles.techText}>Tech: {b.technicianName}</Text>
                <Text style={styles.detailsLink}>View Details →</Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <View style={styles.emptyStateBox}>
            <Calendar size={28} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No bookings yet.</Text>
            <Text style={styles.emptyStateSub}>Your service booking history will appear here.</Text>
          </View>
        )}
      </View>

      {/* 6. Saved Professionals */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Star size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Saved Professionals</Text>
          </View>
        </View>

        {savedPros.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedProsScroll}>
            {savedPros.map((pro) => (
              <View key={pro.id} style={styles.savedProCard}>
                <TouchableOpacity
                  style={styles.removeProBtn}
                  onPress={async () => {
                    await profileService.removeSavedProfessional(user?.id || 'guest', pro.id);
                    setSavedPros(savedPros.filter((p) => p.id !== pro.id));
                  }}
                >
                  <X size={12} color={Colors.error} />
                </TouchableOpacity>
                <Image source={{ uri: pro.avatarUrl || DEFAULT_CUTE_AVATAR }} style={styles.savedProAvatar} />
                <Text style={styles.savedProName}>{pro.name}</Text>
                <Text style={styles.savedProRole}>{pro.profession}</Text>
                <View style={styles.proRatingRow}>
                  <Star size={12} color="#F59E0B" fill="#F59E0B" />
                  <Text style={styles.proRatingText}>{pro.rating}</Text>
                </View>
                <TouchableOpacity style={styles.bookAgainBtn} onPress={() => Alert.alert('Booking', `Initiating booking for ${pro.name}...`)}>
                  <Text style={styles.bookAgainText}>Book Again</Text>
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        ) : (
          <View style={styles.emptyStateBox}>
            <Heart size={28} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No saved professionals.</Text>
            <Text style={styles.emptyStateSub}>Bookmark technicians you love to book them again easily.</Text>
          </View>
        )}
      </View>

      {/* 7. Payment Methods */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <CreditCard size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Payment Methods</Text>
          </View>
          <TouchableOpacity style={styles.iconAddBtn} onPress={openAddPaymentModal}>
            <Plus size={16} color={Colors.primary} />
          </TouchableOpacity>
        </View>

        {paymentMethods.length > 0 ? (
          paymentMethods.map((pm) => (
            <View key={pm.id} style={styles.paymentCard}>
              <View style={styles.payIconCircle}>
                {pm.methodType === 'UPI' ? (
                  <QrCode size={18} color={Colors.primary} />
                ) : pm.methodType === 'Card' ? (
                  <CreditCard size={18} color={Colors.primary} />
                ) : (
                  <SmartphoneNfc size={18} color={Colors.primary} />
                )}
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.payProvider}>{pm.providerName}</Text>
                <Text style={styles.payAccount}>{pm.accountIdentifier}</Text>
              </View>
              {pm.isDefault && (
                <View style={styles.defaultBadgePay}>
                  <Text style={styles.defaultBadgePayText}>PRIMARY</Text>
                </View>
              )}
              <TouchableOpacity onPress={() => handleDeletePayment(pm.id)}>
                <Trash2 size={16} color={Colors.error} style={{ marginLeft: 8 }} />
              </TouchableOpacity>
            </View>
          ))
        ) : (
          <View style={styles.emptyStateBox}>
            <CreditCard size={28} color={Colors.textMuted} />
            <Text style={styles.emptyStateTitle}>No payment methods added.</Text>
            <Text style={styles.emptyStateSub}>Add UPI, Credit Cards, or Wallets for fast checkout.</Text>
          </View>
        )}
      </View>

      {/* 8. Notifications Toggles */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Bell size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Notifications</Text>
          </View>
        </View>

        {[
          { key: 'pushNotif', label: 'Push Notifications', val: settings.pushNotif },
          { key: 'emailNotif', label: 'Email Notifications', val: settings.emailNotif },
          { key: 'smsNotif', label: 'SMS Notifications', val: settings.smsNotif },
          { key: 'remindersNotif', label: 'Service Reminders', val: settings.remindersNotif },
          { key: 'offersNotif', label: 'Offers & Promotions', val: settings.offersNotif },
        ].map((item) => (
          <View key={item.key} style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>{item.label}</Text>
            <Switch
              value={item.val}
              onValueChange={() => handleToggleSetting(item.key as any)}
              trackColor={{ false: Colors.border, true: Colors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>
        ))}
      </View>

      {/* 9. Privacy & Security */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Lock size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Privacy & Security</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.menuRow} onPress={() => setChangePasswordModal(true)}>
          <Text style={styles.menuLabel}>Change Password</Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => setManageDevicesModal(true)}>
          <Text style={styles.menuLabel}>Manage Devices</Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => setTfaModal(true)}>
          <Text style={styles.menuLabel}>Two-Factor Authentication</Text>
          <View style={styles.uiReadyBadge}>
            <Text style={styles.uiReadyText}>Coming Soon</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={handleDownloadData}>
          <Text style={styles.menuLabel}>Download My Data</Text>
          <Download size={16} color={Colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => setDeleteAccountModal(true)}>
          <Text style={[styles.menuLabel, { color: Colors.error }]}>Delete Account</Text>
          <Trash2 size={16} color={Colors.error} />
        </TouchableOpacity>
      </View>

      {/* 10. Help & Support */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <HelpCircle size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>Help & Support</Text>
          </View>
        </View>

        <Text style={styles.subHeading}>Frequently Asked Questions</Text>
        {faqs.map((faq, i) => (
          <TouchableOpacity key={i} style={styles.faqCard} onPress={() => setExpandedFaq(expandedFaq === i ? null : i)}>
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>{faq.q}</Text>
              {expandedFaq === i ? <ChevronUp size={16} color={Colors.primary} /> : <ChevronDown size={16} color={Colors.textMuted} />}
            </View>
            {expandedFaq === i && <Text style={styles.faqAnswer}>{faq.a}</Text>}
          </TouchableOpacity>
        ))}

        <TouchableOpacity style={styles.actionBtnSecondary} onPress={() => setSupportModal(true)}>
          <MessageSquare size={16} color={Colors.primary} />
          <Text style={styles.actionBtnSecondaryText}>Contact Support & Feedback</Text>
        </TouchableOpacity>
      </View>

      {/* 11. About FixNest */}
      <View style={styles.sectionBox}>
        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleRow}>
            <Info size={18} color={Colors.primary} />
            <Text style={styles.sectionTitleText}>About FixNest</Text>
          </View>
          <Text style={styles.appVerText}>v2.4.0 (Build 57)</Text>
        </View>

        <TouchableOpacity style={styles.menuRow} onPress={() => setPolicyModal('privacy')}>
          <Text style={styles.menuLabel}>Privacy Policy</Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => setPolicyModal('terms')}>
          <Text style={styles.menuLabel}>Terms & Conditions</Text>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={handleOpenRateModal}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Star size={16} color="#F59E0B" fill="#F59E0B" />
            <Text style={styles.menuLabel}>Rate FixNest App</Text>
          </View>
          <ChevronRight size={18} color={Colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuRow} onPress={() => setShareModal(true)}>
          <Text style={styles.menuLabel}>Share FixNest with Friends</Text>
          <Share2 size={16} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      {/* 12. Logout */}
      <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutModal(true)}>
        <LogOut size={20} color={Colors.error} />
        <Text style={styles.logoutBtnText}>Log Out</Text>
      </TouchableOpacity>

      <View style={{ height: 100 }} />

      {/* MODALS */}
      {/* 1. Profile Picture Modal */}
      <Modal visible={avatarMenuModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setAvatarMenuModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Profile Picture</Text>
            <Text style={styles.modalSubText}>Select a cute animal avatar or upload your photo.</Text>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
              {CUTE_ANIMAL_AVATARS.map((url, index) => (
                <TouchableOpacity key={index} style={styles.animalAvatarOption} onPress={() => handleUpdateAvatar(url)}>
                  <Image source={{ uri: url }} style={styles.animalAvatarImg} />
                </TouchableOpacity>
              ))}
            </ScrollView>

            {Platform.OS === 'web' && (
              <View style={styles.avatarActionBtn}>
                <Camera size={16} color={Colors.primary} />
                <Text style={styles.avatarActionBtnText}>Upload File from Device</Text>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUploadWeb}
                  style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, opacity: 0, cursor: 'pointer' }}
                />
              </View>
            )}

            <View style={{ marginBottom: 10 }}>
              <TextInput
                style={styles.modalInput}
                value={customAvatarUrlInput}
                onChangeText={setCustomAvatarUrlInput}
                placeholder="Or paste image URL (https://...)"
                placeholderTextColor={Colors.textMuted}
              />
              {customAvatarUrlInput.length > 0 && (
                <TouchableOpacity style={styles.modalSaveBtn} onPress={handleCustomAvatarUrlSubmit}>
                  <Text style={styles.modalSaveText}>Set Image URL</Text>
                </TouchableOpacity>
              )}
            </View>

            <TouchableOpacity style={styles.avatarActionBtn} onPress={() => handleUpdateAvatar(null)}>
              <Trash2 size={16} color={Colors.error} />
              <Text style={[styles.avatarActionBtnText, { color: Colors.error }]}>Remove Photo (Use Animal Default)</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAvatarMenuModal(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 2. Edit Profile Modal */}
      <Modal visible={editProfileModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput style={styles.modalInput} value={editFullName} onChangeText={setEditFullName} placeholder="Full Name" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={editUsername} onChangeText={setEditUsername} placeholder="Username (e.g. @alexrivera)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={editEmail} onChangeText={setEditEmail} placeholder="Email Address" keyboardType="email-address" placeholderTextColor={Colors.textMuted} />

            <View style={styles.phoneInputRow}>
              <TouchableOpacity style={styles.countrySelectorBtn} onPress={() => setCountryPickerModal(true)}>
                <Text style={styles.countryFlagText}>{selectedCountry.flag}</Text>
                <Text style={styles.countryCodeText}>{selectedCountry.code}</Text>
                <ChevronDown size={14} color={Colors.textMuted} />
              </TouchableOpacity>
              <TextInput
                style={styles.phoneTextInput}
                value={editPhoneNumber}
                onChangeText={setEditPhoneNumber}
                keyboardType="phone-pad"
                placeholder="Phone Number"
                placeholderTextColor={Colors.textMuted}
              />
            </View>

            <TextInput style={styles.modalInput} value={editDob} onChangeText={setEditDob} placeholder="Date of Birth (YYYY-MM-DD)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={editGender} onChangeText={setEditGender} placeholder="Gender (Male/Female/Other)" placeholderTextColor={Colors.textMuted} />

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setEditProfileModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveProfile}>
                <Text style={styles.modalSaveText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Country Code Picker Modal */}
      <Modal visible={countryPickerModal} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setCountryPickerModal(false)}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Select Country / Region Code</Text>
            <ScrollView style={{ maxHeight: 260 }}>
              {COUNTRY_CODES.map((c, i) => (
                <TouchableOpacity
                  key={i}
                  style={styles.countryOptionRow}
                  onPress={() => {
                    setSelectedCountry(c);
                    setCountryPickerModal(false);
                  }}
                >
                  <Text style={styles.countryOptionFlag}>{c.flag}</Text>
                  <Text style={styles.countryOptionName}>{c.country}</Text>
                  <Text style={styles.countryOptionCode}>{c.code}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 3. Add/Edit Home Modal */}
      <Modal visible={homeModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingHome ? 'Edit Home' : 'Add New Home'}</Text>
            <TextInput style={styles.modalInput} value={homeNameInput} onChangeText={setHomeNameInput} placeholder="Home Name (e.g. My Residence)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeTypeInput} onChangeText={setHomeTypeInput} placeholder="Property Type (Apartment, Villa, etc.)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeAddrInput} onChangeText={setHomeAddrInput} placeholder="Street Address" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeCityInput} onChangeText={setHomeCityInput} placeholder="City" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeStateInput} onChangeText={setHomeStateInput} placeholder="State" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeCountryInput} onChangeText={setHomeCountryInput} placeholder="Country" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homePincodeInput} onChangeText={setHomePincodeInput} placeholder="Pincode / Postal Code" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={homeMembersInput} onChangeText={setHomeMembersInput} keyboardType="numeric" placeholder="Family Members Count" placeholderTextColor={Colors.textMuted} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Set as Default Home</Text>
              <Switch value={homeDefaultToggle} onValueChange={setHomeDefaultToggle} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFFFFF" />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setHomeModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveHome}>
                <Text style={styles.modalSaveText}>Save Home</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 4. Add/Edit Address Modal */}
      <Modal visible={addressModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingAddress ? 'Edit Address' : 'Add Address'}</Text>
            <TextInput style={styles.modalInput} value={addrTypeInput} onChangeText={setAddrTypeInput} placeholder="Address Type (Home, Office, Other)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrTitleInput} onChangeText={setAddrTitleInput} placeholder="Address Title (e.g. Headquarters)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrFullInput} onChangeText={setAddrFullInput} placeholder="Full Street Address" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrLandmarkInput} onChangeText={setAddrLandmarkInput} placeholder="Landmark (Optional)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrCityInput} onChangeText={setAddrCityInput} placeholder="City" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrStateInput} onChangeText={setAddrStateInput} placeholder="State" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={addrPincodeInput} onChangeText={setAddrPincodeInput} placeholder="Pincode" placeholderTextColor={Colors.textMuted} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Set as Default Address</Text>
              <Switch value={addrDefaultToggle} onValueChange={setAddrDefaultToggle} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFFFFF" />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setAddressModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSaveAddress}>
                <Text style={styles.modalSaveText}>Save Address</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 5. Booking Details Modal */}
      <Modal visible={!!bookingDetailsModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Booking Details</Text>
            {bookingDetailsModal && (
              <View style={{ gap: 8, marginBottom: 16 }}>
                <Text style={styles.detailLabel}>Service: <Text style={styles.detailValue}>{bookingDetailsModal.serviceTitle}</Text></Text>
                <Text style={styles.detailLabel}>Status: <Text style={styles.detailValue}>{bookingDetailsModal.status}</Text></Text>
                <Text style={styles.detailLabel}>Amount: <Text style={styles.detailValue}>{bookingDetailsModal.amount}</Text></Text>
                <Text style={styles.detailLabel}>Date & Time: <Text style={styles.detailValue}>{bookingDetailsModal.date}</Text></Text>
                <Text style={styles.detailLabel}>Technician: <Text style={styles.detailValue}>{bookingDetailsModal.technicianName}</Text></Text>
                <Text style={styles.detailLabel}>Address: <Text style={styles.detailValue}>{bookingDetailsModal.address}</Text></Text>
              </View>
            )}
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setBookingDetailsModal(null)}>
              <Text style={styles.modalSaveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 7. Add Payment Modal */}
      <Modal visible={paymentModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Add Payment Method</Text>
            <TextInput style={styles.modalInput} value={payTypeInput} onChangeText={setPayTypeInput} placeholder="Type (UPI, Card, Wallet)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={payProviderInput} onChangeText={setPayProviderInput} placeholder="Provider (e.g. Visa / Google Pay)" placeholderTextColor={Colors.textMuted} />
            <TextInput style={styles.modalInput} value={payAccountInput} onChangeText={setPayAccountInput} placeholder="UPI ID / Masked Card Identifier" placeholderTextColor={Colors.textMuted} />

            <View style={styles.toggleRow}>
              <Text style={styles.toggleLabel}>Set as Primary Payment Method</Text>
              <Switch value={payDefaultToggle} onValueChange={setPayDefaultToggle} trackColor={{ false: Colors.border, true: Colors.primary }} thumbColor="#FFFFFF" />
            </View>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setPaymentModalVisible(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handleSavePayment}>
                <Text style={styles.modalSaveText}>Save Method</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 10. Change Password Modal */}
      <Modal visible={changePasswordModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              value={newPasswordInput}
              onChangeText={setNewPasswordInput}
              secureTextEntry={!showPassword}
              placeholder="New Password (min 6 chars)"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setChangePasswordModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={handlePasswordChange}>
                <Text style={styles.modalSaveText}>Update Password</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Manage Devices Modal */}
      <Modal visible={manageDevicesModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Smartphone size={32} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Active Login Sessions</Text>
            <View style={styles.deviceRow}>
              <Smartphone size={20} color={Colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.deviceName}>Current Device (Web Session)</Text>
                <Text style={styles.deviceMeta}>Active Now • San Francisco, CA</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setManageDevicesModal(false)}>
              <Text style={styles.modalSaveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 2FA Modal */}
      <Modal visible={tfaModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Shield size={32} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Two-Factor Authentication</Text>
            <Text style={styles.modalSubText}>
              Two-Factor Authentication (2FA) via Authenticator App and SMS OTP is coming soon to FixNest in the next update.
            </Text>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setTfaModal(false)}>
              <Text style={styles.modalSaveText}>Got It</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 11. Support Modal */}
      <Modal visible={supportModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Contact Support & Feedback</Text>
            <TouchableOpacity style={styles.supportOptionRow} onPress={() => Alert.alert('Email Support', 'Email support team at support@fixnest.com')}>
              <Mail size={18} color={Colors.primary} />
              <Text style={styles.supportOptionText}>Email Support (support@fixnest.com)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportOptionRow} onPress={() => Alert.alert('Phone Support', 'Calling 24/7 hotline +1 (800) FIX-NEST')}>
              <Phone size={18} color={Colors.primary} />
              <Text style={styles.supportOptionText}>Phone Support (+1-800-FIX-NEST)</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.supportOptionRow} onPress={() => { setSupportModal(false); setReportBugModal(true); }}>
              <Bug size={18} color={Colors.warning} />
              <Text style={styles.supportOptionText}>Report a Bug</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setSupportModal(false)}>
              <Text style={styles.modalCancelText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Bug Report Modal */}
      <Modal visible={reportBugModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Report an Issue</Text>
            <TextInput style={styles.modalInput} value={bugTitle} onChangeText={setBugTitle} placeholder="Issue Summary" placeholderTextColor={Colors.textMuted} />
            <TextInput style={[styles.modalInput, { height: 80 }]} value={bugDesc} onChangeText={setBugDesc} multiline placeholder="Describe the issue..." placeholderTextColor={Colors.textMuted} />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setReportBugModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { setReportBugModal(false); Alert.alert('Report Sent', 'Thank you. Our engineering team has received your report.'); }}>
                <Text style={styles.modalSaveText}>Submit Report</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Policy Modal */}
      <Modal visible={!!policyModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{policyModal === 'privacy' ? 'Privacy Policy' : 'Terms & Conditions'}</Text>
            <Text style={styles.modalSubText}>
              FixNest respects your data privacy. All user profiles, bookings, and addresses are encrypted with standard TLS 1.3 and stored securely with Row Level Security.
            </Text>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => setPolicyModal(null)}>
              <Text style={styles.modalSaveText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Rate App Modal */}
      <Modal visible={rateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Star size={36} color="#F59E0B" fill="#F59E0B" style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Enjoying FixNest?</Text>
            <Text style={styles.modalSubText}>Tap a star to rate your experience on the App Store.</Text>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { setRateModal(false); Alert.alert('Thank You', 'Thank you for rating FixNest 5 stars!'); }}>
              <Text style={styles.modalSaveText}>Submit Rating ⭐⭐⭐⭐⭐</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      {/* Rate FixNest App Modal */}
      <Modal visible={rateModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Rate FixNest App</Text>
              <TouchableOpacity onPress={() => setRateModal(false)}>
                <X size={20} color={Colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubText}>
              How would you rate your overall experience with FixNest? Your feedback helps us improve our service.
            </Text>

            {/* 5-Star Interactive Rating Picker */}
            <View style={styles.starPickerContainer}>
              {[1, 2, 3, 4, 5].map((starNum) => {
                const isSelected = starNum <= ratingStars;
                return (
                  <TouchableOpacity
                    key={starNum}
                    style={styles.starTouchBtn}
                    onPress={() => setRatingStars(starNum)}
                  >
                    <Star
                      size={30}
                      color={isSelected ? '#F59E0B' : Colors.border}
                      fill={isSelected ? '#F59E0B' : 'transparent'}
                    />
                    <Text style={[styles.starNumLabel, isSelected && styles.starNumLabelSelected]}>
                      {starNum}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Optional Feedback Input Box */}
            <Text style={styles.feedbackFieldLabel}>Optional Feedback & Review:</Text>
            <TextInput
              style={styles.feedbackAreaInput}
              placeholder="Tell us what you love or how we can improve FixNest..."
              placeholderTextColor={Colors.textMuted}
              value={ratingFeedback}
              onChangeText={setRatingFeedback}
              multiline
              numberOfLines={3}
            />

            {/* Action Buttons */}
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setRateModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, submittingRating && { opacity: 0.6 }]}
                onPress={handleSaveRating}
                disabled={submittingRating}
              >
                {submittingRating ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSaveText}>Submit Rating</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Share Modal */}
      <Modal visible={shareModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Share2 size={36} color={Colors.primary} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Share FixNest</Text>
            <Text style={styles.modalSubText}>Share FixNest with friends and family: https://fixnest.app/invite</Text>
            <TouchableOpacity style={styles.modalSaveBtn} onPress={() => { setShareModal(false); Alert.alert('Copied', 'Invite link copied to clipboard!'); }}>
              <Text style={styles.modalSaveText}>Copy Link</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 13. Logout Confirmation Modal */}
      <Modal visible={logoutModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <LogOut size={32} color={Colors.error} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center' }]}>Log Out of FixNest?</Text>
            <Text style={styles.modalSubText}>Are you sure you want to sign out of your account?</Text>
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => setLogoutModal(false)}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalSaveBtn, { backgroundColor: Colors.error }]}
                onPress={async () => {
                  setLogoutModal(false);
                  logout();
                  await clearRole();
                  resetToChooseRole();
                }}
              >
                <Text style={styles.modalSaveText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Account Modal (Requires typing DELETE) */}
      <Modal visible={deleteAccountModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <ShieldAlert size={36} color={Colors.error} style={{ alignSelf: 'center', marginBottom: 12 }} />
            <Text style={[styles.modalTitle, { textAlign: 'center', color: Colors.error }]}>Delete Account</Text>
            <Text style={styles.modalSubText}>Type "DELETE" below to confirm permanent deletion of your account and all associated data.</Text>
            <TextInput
              style={styles.modalInput}
              value={deleteInputText}
              onChangeText={setDeleteInputText}
              placeholder="Type DELETE"
              placeholderTextColor={Colors.textMuted}
            />
            <View style={styles.modalBtnRow}>
              <TouchableOpacity style={styles.modalCancelBtn} onPress={() => { setDeleteAccountModal(false); setDeleteInputText(''); }}>
                <Text style={styles.modalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalSaveBtn, { backgroundColor: Colors.error }]} onPress={handleDeleteAccountSubmit}>
                <Text style={styles.modalSaveText}>Delete Account</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: Colors.background,
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    marginBottom: 20,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarImg: {
    width: 76,
    height: 76,
    borderRadius: 38,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  editAvatarBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.primary,
    borderRadius: 12,
    padding: 6,
    borderWidth: 2,
    borderColor: Colors.background,
  },
  headerInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  userName: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  verifiedText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  userEmail: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  userPhone: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: 8,
  },
  editProfileBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  editProfileBtnText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '600',
  },
  myHomeCard: {
    backgroundColor: '#0A1526',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.4)',
    padding: 20,
    marginBottom: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  homeGlow: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: Colors.primaryGlow,
  },
  homeCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  homeBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  homeTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  homeTypeBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  defaultBadgeText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  addHomeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  addHomeBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  homeTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  homeAddrSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  homeMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  homeMetaText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  homeActionLink: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '700',
  },
  emptyHomeHero: {
    paddingVertical: 10,
  },
  emptyHomeTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  emptyHomeSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  homesScroll: {
    flexDirection: 'row',
    marginTop: 8,
  },
  miniHomePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceElevated,
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginRight: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  miniHomePillActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  miniHomeText: {
    fontSize: 11,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
  },
  statIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  statNum: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  sectionBox: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 18,
    marginBottom: 20,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitleText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  iconAddBtn: {
    padding: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addressCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  addrIconContainer: {
    padding: 4,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderRadius: 6,
  },
  addrTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  primaryBadgeText: {
    color: Colors.success,
    fontSize: 10,
    fontWeight: '800',
  },
  fullAddrText: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  cityText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginBottom: 8,
  },
  itemActionRow: {
    flexDirection: 'row',
    gap: 14,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 6,
  },
  itemActionText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  tabsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  subTab: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  subTabActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  subTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  subTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bookingItemCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  bookingTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bookingItemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bookingCost: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  bookingDateText: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 4,
    marginBottom: 10,
  },
  bookingBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  techText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  detailsLink: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
  },
  savedProsScroll: {
    gap: 12,
  },
  savedProCard: {
    width: 140,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
  },
  removeProBtn: {
    position: 'absolute',
    top: 6,
    right: 6,
    padding: 4,
  },
  savedProAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginBottom: 8,
  },
  savedProName: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  savedProRole: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  proRatingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginVertical: 6,
  },
  proRatingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  bookAgainBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    width: '100%',
    alignItems: 'center',
  },
  bookAgainText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  paymentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
  },
  payIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payProvider: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  payAccount: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 2,
  },
  defaultBadgePay: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  defaultBadgePayText: {
    color: Colors.success,
    fontSize: 9,
    fontWeight: '800',
  },
  emptyStateBox: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyStateTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  emptyStateSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  toggleLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
  },
  menuRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.04)',
  },
  menuLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
  uiReadyBadge: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  uiReadyText: {
    color: Colors.primary,
    fontSize: 10,
    fontWeight: '700',
  },
  subHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  faqCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 8,
  },
  faqHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqQuestion: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textPrimary,
    flex: 1,
    paddingRight: 8,
  },
  faqAnswer: {
    fontSize: 11,
    color: Colors.textSecondary,
    marginTop: 8,
    lineHeight: 16,
  },
  actionBtnSecondary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  actionBtnSecondaryText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '700',
  },
  appVerText: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    borderRadius: 16,
    marginTop: 10,
  },
  logoutBtnText: {
    color: Colors.error,
    fontSize: 15,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 20,
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.textPrimary,
    marginBottom: 8,
  },
  modalSubText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 16,
    lineHeight: 16,
  },
  modalInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    marginBottom: 12,
  },
  phoneInputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  countrySelectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 10,
    height: 48,
  },
  countryFlagText: {
    fontSize: 16,
  },
  countryCodeText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  phoneTextInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 12,
    color: Colors.textPrimary,
    fontSize: 14,
    height: 48,
  },
  countryOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  countryOptionFlag: {
    fontSize: 18,
    marginRight: 10,
  },
  countryOptionName: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  countryOptionCode: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  animalAvatarOption: {
    marginRight: 10,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: Colors.primary,
    overflow: 'hidden',
  },
  animalAvatarImg: {
    width: 48,
    height: 48,
  },
  avatarActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    marginBottom: 10,
    position: 'relative',
  },
  avatarActionBtnText: {
    color: Colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  detailLabel: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  detailValue: {
    color: Colors.textPrimary,
    fontWeight: '700',
  },
  deviceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  deviceMeta: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
  },
  supportOptionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
  },
  supportOptionText: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  modalBtnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 8,
  },
  modalCancelBtn: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    color: Colors.textSecondary,
    fontSize: 14,
    fontWeight: '600',
  },
  modalSaveBtn: {
    flex: 1,
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalSaveText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  starPickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    marginVertical: 14,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  starTouchBtn: {
    alignItems: 'center',
    padding: 6,
  },
  starNumLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.textMuted,
    marginTop: 4,
  },
  starNumLabelSelected: {
    color: '#F59E0B',
  },
  feedbackFieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  feedbackAreaInput: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    color: Colors.textPrimary,
    fontSize: 13,
    minHeight: 70,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
});
