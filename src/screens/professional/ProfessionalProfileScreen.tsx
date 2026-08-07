import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Platform,
  Alert,
  Switch,
  ActivityIndicator,
  Image,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useNavigation } from '@react-navigation/native';
import { CommonActions } from '@react-navigation/native';
import { resetToChooseRole } from '../../navigation/NavigationService';
import {
  User,
  Phone,
  Mail,
  FileText,
  Briefcase,
  MapPin,
  Plus,
  X,
  Check,
  ChevronDown,
  ChevronUp,
  Save,
  Camera,
  Star,
  CheckSquare,
  Square,
  ToggleLeft,
  ToggleRight,
  Grid,
  Upload,
  LogOut,
} from 'lucide-react-native';
import { Colors } from '../../constants/colors';
import { useProfessional } from '../../context/ProfessionalContext';
import { ProfessionalProfile } from '../../types/professional';
import { HOUSEHOLD_SERVICES, SERVICE_GROUPS, ServiceCategory } from '../../constants/services';

const AVATAR_OPTIONS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1552058544-f2b08422138a?auto=format&fit=crop&w=300&q=80',
  'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=300&q=80',
];

const EXPERIENCE_OPTIONS = [
  '< 1 year', '1 year', '2 years', '3 years', '4 years',
  '5 years', '6 years', '7 years', '8 years', '10+ years', '15+ years',
];

const INDIAN_CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai',
  'Pune', 'Kolkata', 'Ahmedabad', 'Jaipur', 'Lucknow',
  'Thane', 'Navi Mumbai', 'Noida', 'Gurgaon', 'Chandigarh',
  'Indore', 'Surat', 'Coimbatore', 'Kochi', 'Nagpur',
];

interface ProfessionalProfileScreenProps {
  onSaved?: () => void;
  isOnboarding?: boolean;
}

export const ProfessionalProfileScreen: React.FC<ProfessionalProfileScreenProps> = ({
  onSaved,
  isOnboarding = false,
}) => {
  const { proProfile, setProProfile, updateProProfile, clearRole, setRole } = useProfessional();
  const navigation = useNavigation();

  const handleExitProfessionalMode = async () => {
    const doExit = async () => {
      await setRole(null);
      await clearRole();
      resetToChooseRole();
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(
        'Exit Professional Mode?\nYou will be taken back to the "How would you like to continue?" screen.',
      );
      if (confirmed) {
        await doExit();
      }
      return;
    }

    Alert.alert(
      'Exit Professional Mode',
      'You will be taken back to the "How would you like to continue?" screen.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit Professional Mode',
          style: 'destructive',
          onPress: doExit,
        },
      ],
    );
  };

  // Form fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [workingArea, setWorkingArea] = useState('');
  const [workingAreas, setWorkingAreas] = useState<string[]>([]);
  const [city, setCity] = useState('');
  const [availability, setAvailability] = useState(true);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [photoUrl, setPhotoUrl] = useState<string>(AVATAR_OPTIONS[0]);

  // UI states
  const [saving, setSaving] = useState(false);
  const [showExperiencePicker, setShowExperiencePicker] = useState(false);
  const [showCityPicker, setShowCityPicker] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [servicesExpanded, setServicesExpanded] = useState<Record<string, boolean>>({});
  const [serviceGroupFilter, setServiceGroupFilter] = useState('All');

  // Load existing profile
  useEffect(() => {
    if (proProfile) {
      setName(proProfile.name);
      setPhone(proProfile.phone);
      setEmail(proProfile.email);
      setBio(proProfile.bio);
      setExperience(proProfile.experience);
      setWorkingAreas(proProfile.workingAreas);
      setCity(proProfile.currentLocation.city);
      setAvailability(proProfile.availability);
      setSelectedServices(proProfile.services);
      setPhotoUrl(proProfile.photoUrl || AVATAR_OPTIONS[0]);
    }
  }, [proProfile?.id]);

  const toggleService = (serviceId: string) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((s) => s !== serviceId)
        : [...prev, serviceId],
    );
  };

  const addWorkingArea = () => {
    const trimmed = workingArea.trim();
    if (trimmed && !workingAreas.includes(trimmed)) {
      setWorkingAreas((prev) => [...prev, trimmed]);
      setWorkingArea('');
    }
  };

  const handlePickPhotoFromDevice = async () => {
    try {
      setUploadingPhoto(true);
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
        setPhotoUrl(result.assets[0].uri);
        setShowAvatarPicker(false);
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to open photo library. Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const removeWorkingArea = (area: string) => {
    setWorkingAreas((prev) => prev.filter((a) => a !== area));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Required', 'Please enter your full name.');
      return;
    }
    if (!phone.trim()) {
      Alert.alert('Required', 'Please enter your phone number.');
      return;
    }
    if (selectedServices.length === 0) {
      Alert.alert('Required', 'Please select at least one service category.');
      return;
    }
    if (!city.trim()) {
      Alert.alert('Required', 'Please enter your current location city.');
      return;
    }

    setSaving(true);
    try {
      const profile: ProfessionalProfile = {
        id: proProfile?.id || 'pro_' + Date.now(),
        userId: proProfile?.userId,
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        bio: bio.trim(),
        experience: experience || '1 year',
        workingAreas: workingAreas.length > 0 ? workingAreas : [city.trim()],
        currentLocation: { city: city.trim() },
        availability,
        services: selectedServices,
        photoUrl,
        rating: proProfile?.rating ?? 5.0,
        completedJobs: proProfile?.completedJobs ?? 0,
        registeredAt: proProfile?.registeredAt || new Date().toISOString(),
      };

      if (proProfile?.id) {
        await updateProProfile(profile);
      } else {
        await setProProfile(profile);
      }

      Alert.alert(
        '✅ Profile Saved',
        isOnboarding
          ? 'Welcome to FixNest Pro! Your profile is live.'
          : 'Your professional profile has been updated.',
        [{ text: 'OK', onPress: onSaved }],
      );
    } catch (e) {
      Alert.alert('Error', 'Failed to save profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Filter services by group
  const filteredServices =
    serviceGroupFilter === 'All'
      ? HOUSEHOLD_SERVICES
      : HOUSEHOLD_SERVICES.filter((s) => s.categoryGroup === serviceGroupFilter);

  // Group services by categoryGroup for display
  const servicesByGroup: Record<string, ServiceCategory[]> = {};
  filteredServices.forEach((s) => {
    if (!servicesByGroup[s.categoryGroup]) servicesByGroup[s.categoryGroup] = [];
    servicesByGroup[s.categoryGroup].push(s);
  });

  const PURPLE = '#A855F7';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.title}>
              {isOnboarding ? 'Set Up Your Pro Profile' : 'Edit Professional Profile'}
            </Text>
            <Text style={styles.subtitle}>
              {isOnboarding
                ? 'Tell customers about your skills and availability'
                : 'Keep your profile up to date to get more bookings'}
            </Text>
          </View>
          <TouchableOpacity
            style={styles.topRightExitBtn}
            onPress={handleExitProfessionalMode}
            activeOpacity={0.8}
          >
            <LogOut size={16} color={Colors.error} />
            <Text style={styles.topRightExitText}>Exit</Text>
          </TouchableOpacity>
        </View>

        {/* Avatar Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Profile Photo</Text>
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={() => setShowAvatarPicker(!showAvatarPicker)}
            activeOpacity={0.8}
          >
            <Image source={{ uri: photoUrl }} style={styles.avatarImg} />
            <View style={styles.avatarEditBadge}>
              <Camera size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>
          {showAvatarPicker && (
            <View style={styles.avatarGrid}>
              {/* Upload from device option */}
              <TouchableOpacity
                style={styles.avatarUploadBtn}
                onPress={handlePickPhotoFromDevice}
                disabled={uploadingPhoto}
                activeOpacity={0.8}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color={PURPLE} />
                ) : (
                  <>
                    <Upload size={20} color={PURPLE} />
                    <Text style={styles.avatarUploadText}>Upload{`\n`}Photo</Text>
                  </>
                )}
              </TouchableOpacity>
              {AVATAR_OPTIONS.map((url, i) => (
                <TouchableOpacity
                  key={i}
                  onPress={() => { setPhotoUrl(url); setShowAvatarPicker(false); }}
                  style={[styles.avatarOption, photoUrl === url && styles.avatarOptionSelected]}
                >
                  <Image source={{ uri: url }} style={styles.avatarOptionImg} />
                  {photoUrl === url && (
                    <View style={styles.avatarCheck}>
                      <Check size={12} color="#FFFFFF" />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Personal Info */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Personal Information</Text>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <User size={16} color={Colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Full Name *"
              placeholderTextColor={Colors.textMuted}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Phone size={16} color={Colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Phone Number *"
              placeholderTextColor={Colors.textMuted}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <View style={styles.inputIcon}>
              <Mail size={16} color={Colors.textMuted} />
            </View>
            <TextInput
              style={styles.input}
              placeholder="Email Address"
              placeholderTextColor={Colors.textMuted}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={[styles.inputGroup, { height: 90, alignItems: 'flex-start' }]}>
            <View style={[styles.inputIcon, { paddingTop: 14 }]}>
              <FileText size={16} color={Colors.textMuted} />
            </View>
            <TextInput
              style={[styles.input, { height: 80, textAlignVertical: 'top', paddingTop: 14 }]}
              placeholder="Short bio about your expertise..."
              placeholderTextColor={Colors.textMuted}
              value={bio}
              onChangeText={setBio}
              multiline
              maxLength={250}
            />
          </View>
        </View>

        {/* Experience */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Experience</Text>
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowExperiencePicker(!showExperiencePicker)}
            activeOpacity={0.8}
          >
            <Briefcase size={16} color={Colors.textMuted} />
            <Text style={[styles.pickerBtnText, experience && { color: Colors.textPrimary }]}>
              {experience || 'Select years of experience'}
            </Text>
            {showExperiencePicker ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
          {showExperiencePicker && (
            <View style={styles.dropdownList}>
              {EXPERIENCE_OPTIONS.map((opt) => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.dropdownItem, experience === opt && styles.dropdownItemActive]}
                  onPress={() => { setExperience(opt); setShowExperiencePicker(false); }}
                >
                  <Text style={[styles.dropdownItemText, experience === opt && { color: PURPLE }]}>
                    {opt}
                  </Text>
                  {experience === opt && <Check size={14} color={PURPLE} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Location & Working Areas */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Location & Working Areas</Text>

          {/* Current City */}
          <TouchableOpacity
            style={styles.pickerBtn}
            onPress={() => setShowCityPicker(!showCityPicker)}
            activeOpacity={0.8}
          >
            <MapPin size={16} color={Colors.textMuted} />
            <Text style={[styles.pickerBtnText, city && { color: Colors.textPrimary }]}>
              {city || 'Current city *'}
            </Text>
            {showCityPicker ? (
              <ChevronUp size={16} color={Colors.textMuted} />
            ) : (
              <ChevronDown size={16} color={Colors.textMuted} />
            )}
          </TouchableOpacity>
          {showCityPicker && (
            <View style={styles.dropdownList}>
              {INDIAN_CITIES.map((c) => (
                <TouchableOpacity
                  key={c}
                  style={[styles.dropdownItem, city === c && styles.dropdownItemActive]}
                  onPress={() => { setCity(c); setShowCityPicker(false); }}
                >
                  <Text style={[styles.dropdownItemText, city === c && { color: PURPLE }]}>{c}</Text>
                  {city === c && <Check size={14} color={PURPLE} />}
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* Working areas tags */}
          <Text style={styles.fieldSubLabel}>Areas you serve (add multiple):</Text>
          <View style={styles.addAreaRow}>
            <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
              <View style={styles.inputIcon}>
                <MapPin size={15} color={Colors.textMuted} />
              </View>
              <TextInput
                style={styles.input}
                placeholder="Add area / city"
                placeholderTextColor={Colors.textMuted}
                value={workingArea}
                onChangeText={setWorkingArea}
                onSubmitEditing={addWorkingArea}
                returnKeyType="done"
              />
            </View>
            <TouchableOpacity style={styles.addBtn} onPress={addWorkingArea}>
              <Plus size={18} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {workingAreas.length > 0 && (
            <View style={styles.tagsRow}>
              {workingAreas.map((area) => (
                <View key={area} style={styles.tag}>
                  <Text style={styles.tagText}>{area}</Text>
                  <TouchableOpacity onPress={() => removeWorkingArea(area)}>
                    <X size={12} color={PURPLE} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Availability Toggle */}
        <View style={styles.section}>
          <View style={styles.availabilityRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.sectionLabel}>Availability</Text>
              <Text style={styles.fieldSubLabel}>
                {availability
                  ? '🟢 You are visible to customers and will receive new requests'
                  : '🔴 You are offline — no new requests will be sent to you'}
              </Text>
            </View>
            <Switch
              value={availability}
              onValueChange={setAvailability}
              trackColor={{ false: Colors.border, true: `${PURPLE}66` }}
              thumbColor={availability ? PURPLE : Colors.textMuted}
            />
          </View>
        </View>

        {/* Service Selection */}
        <View style={styles.section}>
          <View style={styles.serviceHeader}>
            <Text style={styles.sectionLabel}>Select Your Services</Text>
            <View style={styles.serviceCountBadge}>
              <Text style={styles.serviceCountText}>{selectedServices.length} selected</Text>
            </View>
          </View>
          <Text style={styles.fieldSubLabel}>
            You'll only receive booking requests for the services you select below.
          </Text>

          {/* Group filter */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.groupPillsRow}
          >
            {([...SERVICE_GROUPS] as string[]).map((group) => (
              <TouchableOpacity
                key={group}
                style={[
                  styles.groupPill,
                  serviceGroupFilter === group && styles.groupPillActive,
                ]}
                onPress={() => setServiceGroupFilter(group)}
              >
                <Text
                  style={[
                    styles.groupPillText,
                    serviceGroupFilter === group && styles.groupPillTextActive,
                  ]}
                >
                  {group}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Services grid */}
          {Object.entries(servicesByGroup).map(([group, services]) => (
            <View key={group} style={styles.serviceGroupBlock}>
              <Text style={styles.groupTitle}>{group}</Text>
              <View style={styles.servicesGrid}>
                {services.map((s) => {
                  const isSelected = selectedServices.includes(s.id);
                  return (
                    <TouchableOpacity
                      key={s.id}
                      style={[styles.serviceChip, isSelected && styles.serviceChipActive]}
                      onPress={() => toggleService(s.id)}
                      activeOpacity={0.75}
                    >
                      {isSelected ? (
                        <CheckSquare size={14} color={PURPLE} />
                      ) : (
                        <Square size={14} color={Colors.textMuted} />
                      )}
                      <Text
                        style={[
                          styles.serviceChipText,
                          isSelected && styles.serviceChipTextActive,
                        ]}
                        numberOfLines={2}
                      >
                        {s.title}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          ))}
        </View>

        {/* Stats (read-only for existing profile) */}
        {proProfile && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Your Stats</Text>
            <View style={styles.statsRow}>
              <View style={styles.statBox}>
                <Star size={18} color={Colors.warning} fill={Colors.warning} />
                <Text style={styles.statValue}>{proProfile.rating.toFixed(1)}</Text>
                <Text style={styles.statLabel}>Rating</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statValue}>{proProfile.completedJobs}</Text>
                <Text style={styles.statLabel}>Jobs Done</Text>
              </View>
            </View>
          </View>
        )}

        {/* Save Button */}
        <TouchableOpacity
          style={[styles.saveBtn, saving && { opacity: 0.7 }]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.85}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <>
              <Save size={18} color="#FFFFFF" />
              <Text style={styles.saveBtnText}>
                {isOnboarding ? 'Create My Pro Profile' : 'Save Changes'}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {/* Exit Professional Mode — at the end of the profile page */}
        <TouchableOpacity
          style={styles.exitProBtn}
          activeOpacity={0.85}
          onPress={handleExitProfessionalMode}
        >
          <LogOut size={18} color={Colors.error} />
          <Text style={styles.exitProBtnText}>Exit Professional Mode</Text>
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>
    </SafeAreaView>
  );
};

const PURPLE = '#A855F7';

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 20, paddingBottom: 40 },
  header: { marginBottom: 20 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 12,
  },
  topRightExitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: `${Colors.error}15`,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: `${Colors.error}33`,
    gap: 6,
  },
  topRightExitText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.error,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 4,
    lineHeight: 19,
  },
  section: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  fieldSubLabel: {
    fontSize: 12,
    color: Colors.textMuted,
    marginBottom: 10,
    lineHeight: 17,
  },
  // Avatar
  avatarContainer: {
    alignSelf: 'flex-start',
    position: 'relative',
    marginBottom: 12,
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2.5,
    borderColor: PURPLE,
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  avatarOption: {
    position: 'relative',
    borderRadius: 30,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: PURPLE,
  },
  avatarOptionImg: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarCheck: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: PURPLE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarUploadBtn: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: `${PURPLE}18`,
    borderWidth: 2,
    borderColor: `${PURPLE}55`,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  avatarUploadText: {
    fontSize: 9,
    fontWeight: '700',
    color: PURPLE,
    textAlign: 'center',
    lineHeight: 11,
  },
  // Inputs
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 10,
    height: 50,
    overflow: 'hidden',
  },
  inputIcon: {
    width: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    fontSize: 14,
    paddingRight: 12,
  },
  // Pickers
  pickerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    height: 50,
    gap: 10,
    marginBottom: 4,
  },
  pickerBtnText: {
    flex: 1,
    fontSize: 14,
    color: Colors.textMuted,
  },
  dropdownList: {
    backgroundColor: Colors.surfaceCard,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginTop: 4,
    marginBottom: 8,
    maxHeight: 240,
    overflow: 'scroll',
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  dropdownItemActive: {
    backgroundColor: `${PURPLE}11`,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  // Working areas
  addAreaRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
    marginBottom: 10,
  },
  addBtn: {
    width: 44,
    height: 50,
    backgroundColor: PURPLE,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: `${PURPLE}18`,
    borderWidth: 1,
    borderColor: `${PURPLE}40`,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tagText: {
    fontSize: 12,
    color: PURPLE,
    fontWeight: '600',
  },
  // Availability
  availabilityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 12,
  },
  // Services
  serviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  serviceCountBadge: {
    backgroundColor: `${PURPLE}22`,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  serviceCountText: {
    fontSize: 11,
    fontWeight: '700',
    color: PURPLE,
  },
  groupPillsRow: {
    gap: 8,
    paddingBottom: 12,
  },
  groupPill: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  groupPillActive: {
    backgroundColor: `${PURPLE}22`,
    borderColor: `${PURPLE}66`,
  },
  groupPillText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  groupPillTextActive: {
    color: PURPLE,
    fontWeight: '700',
  },
  serviceGroupBlock: {
    marginBottom: 16,
  },
  groupTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  servicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 7,
    width: '47%',
  },
  serviceChipActive: {
    backgroundColor: `${PURPLE}12`,
    borderColor: `${PURPLE}55`,
  },
  serviceChipText: {
    fontSize: 11,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 15,
  },
  serviceChipTextActive: {
    color: PURPLE,
    fontWeight: '600',
  },
  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statBox: {
    flex: 1,
    backgroundColor: Colors.surfaceCard,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    paddingVertical: 14,
    gap: 4,
  },
  statValue: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  // Save
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: PURPLE,
    borderRadius: 16,
    paddingVertical: 16,
    shadowColor: PURPLE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    marginTop: 8,
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  // Exit professional mode button
  exitProBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    marginTop: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(239,68,68,0.4)',
    borderRadius: 16,
    paddingVertical: 15,
    backgroundColor: 'rgba(239,68,68,0.06)',
  },
  exitProBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.error,
  },
});
