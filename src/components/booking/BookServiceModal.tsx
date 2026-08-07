import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Linking,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  MapPin,
  X,
  CheckCircle2,
  ExternalLink,
  ArrowRight,
  ShieldCheck,
  Building,
  AlertCircle,
  Plus,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../context/NotificationContext';
import { profileService, AddressItem } from '../../services/profileService';

interface BookServiceModalProps {
  visible: boolean;
  onClose: () => void;
  serviceTitle: string;
}

export const BookServiceModal: React.FC<BookServiceModalProps> = ({
  visible,
  onClose,
  serviceTitle,
}) => {
  const { user } = useAuth();
  const { addNotification } = useNotifications();

  const targetTitle = serviceTitle?.trim() || 'Electrician';

  // Address choice state: null (Ask) | true (Yes, Saved) | false (No, Custom)
  const [isAtSavedAddress, setIsAtSavedAddress] = useState<boolean | null>(null);

  // Fetched user address state
  const [savedAddress, setSavedAddress] = useState<AddressItem | null>(null);
  const [loadingAddress, setLoadingAddress] = useState(false);

  // Address input fields
  const [streetAddress, setStreetAddress] = useState('');
  const [city, setCity] = useState('');
  const [pincode, setPincode] = useState('');
  const [confirmedAddress, setConfirmedAddress] = useState('');

  useEffect(() => {
    if (visible) {
      setIsAtSavedAddress(null);
      setStreetAddress('');
      setCity('');
      setPincode('');
      setConfirmedAddress('');
      setSavedAddress(null);

      const userIdToFetch = user?.id || 'usr_default';
      fetchUserAddress(userIdToFetch);
    }
  }, [visible, user?.id]);

  const fetchUserAddress = async (userId: string) => {
    setLoadingAddress(true);
    try {
      const fetched = await profileService.getAddresses(userId);
      const primaryAddr = fetched.find((a) => a.isDefault) || fetched[0] || null;
      setSavedAddress(primaryAddr);

      if (!primaryAddr) {
        // If user has no saved address, default to entering address
        setIsAtSavedAddress(false);
      }
    } catch (err) {
      console.warn('[BookServiceModal] Error fetching address:', err);
    } finally {
      setLoadingAddress(false);
    }
  };

  const formattedSavedAddress = savedAddress
    ? `${savedAddress.fullAddress}, ${savedAddress.city}${savedAddress.pincode ? ' - ' + savedAddress.pincode : ''}`
    : null;

  const handleSelectSaved = () => {
    if (!formattedSavedAddress) return;
    setIsAtSavedAddress(true);
    setConfirmedAddress(formattedSavedAddress);
  };

  const handleSelectCustom = () => {
    setIsAtSavedAddress(false);
  };

  const handleConfirmCustomAddress = () => {
    if (!streetAddress.trim() || !city.trim()) {
      Alert.alert('Address Required', 'Please enter your street address and city to continue.');
      return;
    }
    const fullCustom = `${streetAddress.trim()}, ${city.trim()}${pincode.trim() ? ' - ' + pincode.trim() : ''}`;
    setConfirmedAddress(fullCustom);
  };

  const handleFinalRedirect = async () => {
    const finalLocation = confirmedAddress.trim() || formattedSavedAddress;
    if (!finalLocation) {
      Alert.alert('Address Missing', 'Please enter or select a service address.');
      return;
    }

    try {
      const activeUserId = user?.id || 'usr_default';
      await profileService.addBooking(activeUserId, {
        serviceTitle: targetTitle,
        status: 'Upcoming',
        amount: 'Est. ₹499 - ₹899',
        date: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) + ', ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        technicianName: 'Certified Service Professional',
        address: finalLocation,
      });

      // 🔔 Fire booking notification
      addNotification({
        type: 'booking',
        title: `${targetTitle} Booked Successfully`,
        message: `Your ${targetTitle} request has been placed for ${finalLocation}. A certified professional will be assigned shortly.`,
      });
    } catch (e) {
      console.warn('[BookServiceModal] Error registering booking:', e);
    }

    const query = `${targetTitle} near ${finalLocation}`;
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}`;

    try {
      const canOpen = await Linking.canOpenURL(searchUrl);
      if (canOpen || Platform.OS === 'web') {
        await Linking.openURL(searchUrl);
      } else {
        Alert.alert('Search URL', searchUrl);
      }
    } catch (err) {
      console.error('[BookServiceModal] Error opening link:', err);
      if (Platform.OS === 'web') {
        window.open(searchUrl, '_blank');
      }
    } finally {
      onClose();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.headerTitleRow}>
              <MapPin size={22} color={Colors.primary} />
              <Text style={styles.modalTitle}>Confirm Service Location</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {/* Service Banner */}
            <View style={styles.serviceBanner}>
              <Text style={styles.serviceBannerLabel}>Target Service</Text>
              <Text style={styles.serviceBannerTitle}>{targetTitle}</Text>
            </View>

            {loadingAddress ? (
              <View style={styles.loadingBox}>
                <ActivityIndicator size="small" color={Colors.primary} />
                <Text style={styles.loadingText}>Fetching saved profile address...</Text>
              </View>
            ) : (
              <>
                {/* CASE A: User has a saved profile address and hasn't chosen yet */}
                {isAtSavedAddress === null && formattedSavedAddress && (
                  <View style={styles.questionSection}>
                    <Text style={styles.questionText}>
                      Are you currently at this address?
                    </Text>

                    <View style={styles.savedCardPreview}>
                      <Building size={20} color={Colors.primary} style={{ marginTop: 2 }} />
                      <View style={{ flex: 1, marginLeft: 10 }}>
                        <Text style={styles.savedCardTitle}>
                          {savedAddress?.title || 'Saved Profile Address'}
                        </Text>
                        <Text style={styles.savedCardText}>{formattedSavedAddress}</Text>
                      </View>
                    </View>

                    <View style={styles.choiceButtonsRow}>
                      <TouchableOpacity
                        style={[styles.choiceBtn, styles.choiceBtnYes]}
                        onPress={handleSelectSaved}
                      >
                        <CheckCircle2 size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                        <Text style={styles.choiceBtnYesText}>Yes, Use This</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.choiceBtn, styles.choiceBtnNo]}
                        onPress={handleSelectCustom}
                      >
                        <MapPin size={18} color={Colors.primary} style={{ marginRight: 6 }} />
                        <Text style={styles.choiceBtnNoText}>No, Different Address</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* CASE B: User selected YES (Using saved address) */}
                {isAtSavedAddress === true && formattedSavedAddress && (
                  <View style={styles.confirmationSection}>
                    <View style={styles.statusBadge}>
                      <CheckCircle2 size={16} color={Colors.success} />
                      <Text style={styles.statusBadgeText}>Using Profile Saved Address</Text>
                    </View>

                    <View style={styles.addressDisplayBox}>
                      <MapPin size={20} color={Colors.primary} style={{ marginTop: 2 }} />
                      <Text style={styles.addressDisplayText}>{confirmedAddress || formattedSavedAddress}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.changeAddressLink}
                      onPress={() => {
                        setIsAtSavedAddress(null);
                        setConfirmedAddress('');
                      }}
                    >
                      <Text style={styles.changeAddressLinkText}>Change service address</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.proceedBtn}
                      onPress={handleFinalRedirect}
                    >
                      <Text style={styles.proceedBtnText}>Find Nearby Providers</Text>
                      <ExternalLink size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                )}

                {/* CASE C: User selected NO or has NO saved address in profile */}
                {isAtSavedAddress === false && !confirmedAddress && (
                  <View style={styles.formSection}>
                    {!formattedSavedAddress ? (
                      <View style={styles.noAddressNotice}>
                        <AlertCircle size={20} color={Colors.warning} />
                        <View style={{ flex: 1, marginLeft: 10 }}>
                          <Text style={styles.noAddressTitle}>No saved address found</Text>
                          <Text style={styles.noAddressSub}>
                            Please enter your current service location below to find nearby providers.
                          </Text>
                        </View>
                      </View>
                    ) : (
                      <>
                        <Text style={styles.formTitle}>Enter Service Location</Text>
                        <Text style={styles.formSubtitle}>
                          Enter your current location to search nearby certified service providers.
                        </Text>
                      </>
                    )}

                    <View style={styles.inputGroup}>
                      <Text style={styles.inputLabel}>House / Flat / Street Address *</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="House / Flat / Street address"
                        placeholderTextColor={Colors.textMuted}
                        value={streetAddress}
                        onChangeText={setStreetAddress}
                      />
                    </View>

                    <View style={styles.rowInputs}>
                      <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                        <Text style={styles.inputLabel}>City *</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="City"
                          placeholderTextColor={Colors.textMuted}
                          value={city}
                          onChangeText={setCity}
                        />
                      </View>

                      <View style={[styles.inputGroup, { flex: 1, marginLeft: 8 }]}>
                        <Text style={styles.inputLabel}>Pincode (Optional)</Text>
                        <TextInput
                          style={styles.textInput}
                          placeholder="Pincode"
                          placeholderTextColor={Colors.textMuted}
                          keyboardType="numeric"
                          value={pincode}
                          onChangeText={setPincode}
                        />
                      </View>
                    </View>

                    <TouchableOpacity
                      style={styles.confirmLocationBtn}
                      onPress={handleConfirmCustomAddress}
                    >
                      <Text style={styles.confirmLocationBtnText}>Confirm Location</Text>
                      <ArrowRight size={18} color="#FFFFFF" style={{ marginLeft: 6 }} />
                    </TouchableOpacity>

                    {formattedSavedAddress && (
                      <TouchableOpacity
                        style={styles.backBtn}
                        onPress={() => setIsAtSavedAddress(null)}
                      >
                        <Text style={styles.backBtnText}>Back to Saved Profile Address</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}

                {/* CASE D: Custom address confirmed */}
                {isAtSavedAddress === false && !!confirmedAddress && (
                  <View style={styles.confirmationSection}>
                    <View style={styles.statusBadge}>
                      <CheckCircle2 size={16} color={Colors.success} />
                      <Text style={styles.statusBadgeText}>Location Confirmed</Text>
                    </View>

                    <View style={styles.addressDisplayBox}>
                      <MapPin size={20} color={Colors.primary} style={{ marginTop: 2 }} />
                      <Text style={styles.addressDisplayText}>{confirmedAddress}</Text>
                    </View>

                    <TouchableOpacity
                      style={styles.changeAddressLink}
                      onPress={() => setConfirmedAddress('')}
                    >
                      <Text style={styles.changeAddressLinkText}>Edit address details</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.proceedBtn}
                      onPress={handleFinalRedirect}
                    >
                      <Text style={styles.proceedBtnText}>Find Nearby Providers</Text>
                      <ExternalLink size={18} color="#FFFFFF" style={{ marginLeft: 8 }} />
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}

            {/* Reassurance footer */}
            <View style={styles.footerNote}>
              <ShieldCheck size={14} color={Colors.textMuted} />
              <Text style={styles.footerNoteText}>
                FixNest connects you with verified local service professionals near your location.
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 15, 0.82)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '85%',
    borderWidth: 1,
    borderColor: Colors.border,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginLeft: 10,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 20,
    backgroundColor: Colors.background,
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  serviceBanner: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 20,
  },
  serviceBannerLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    fontWeight: '600',
  },
  serviceBannerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.primary,
    marginTop: 2,
  },
  loadingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 14,
    color: Colors.textMuted,
    marginLeft: 10,
  },
  questionSection: {
    marginBottom: 20,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: 14,
    lineHeight: 22,
  },
  savedCardPreview: {
    flexDirection: 'row',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 16,
  },
  savedCardTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  savedCardText: {
    fontSize: 14,
    color: Colors.textPrimary,
    marginTop: 4,
    lineHeight: 20,
  },
  choiceButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  choiceBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
  },
  choiceBtnYes: {
    backgroundColor: Colors.primary,
  },
  choiceBtnYesText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  choiceBtnNo: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  choiceBtnNoText: {
    color: Colors.textPrimary,
    fontWeight: '600',
    fontSize: 14,
  },
  confirmationSection: {
    marginBottom: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 12,
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    marginLeft: 6,
  },
  addressDisplayBox: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 12,
  },
  addressDisplayText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.textPrimary,
    marginLeft: 12,
    flex: 1,
    lineHeight: 20,
  },
  changeAddressLink: {
    marginBottom: 20,
    alignSelf: 'flex-start',
  },
  changeAddressLinkText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  proceedBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  proceedBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  formSection: {
    marginBottom: 20,
  },
  noAddressNotice: {
    flexDirection: 'row',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: 'rgba(245, 158, 11, 0.3)',
    marginBottom: 18,
    alignItems: 'flex-start',
  },
  noAddressTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warning,
  },
  noAddressSub: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  formTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 4,
  },
  formSubtitle: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 14,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  textInput: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: Colors.textPrimary,
    fontSize: 14,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  confirmLocationBtn: {
    flexDirection: 'row',
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    marginBottom: 10,
  },
  confirmLocationBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  backBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  backBtnText: {
    color: Colors.textMuted,
    fontSize: 13,
  },
  footerNote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingBottom: 10,
  },
  footerNoteText: {
    fontSize: 12,
    color: Colors.textMuted,
    marginLeft: 6,
    textAlign: 'center',
    flex: 1,
  },
});
