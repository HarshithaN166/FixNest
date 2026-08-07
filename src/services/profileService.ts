import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase, isSupabaseConfigured } from './supabase';

export const CUTE_ANIMAL_AVATARS = [
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=300&q=80', // Cute Dog
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=300&q=80', // Cute Cat
  'https://images.unsplash.com/photo-1564349683136-77e08dba1ef9?auto=format&fit=crop&w=300&q=80', // Cute Panda
  'https://images.unsplash.com/photo-1474511320723-9a56873867b5?auto=format&fit=crop&w=300&q=80', // Cute Fox
  'https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?auto=format&fit=crop&w=300&q=80', // Cute Rabbit
];

export const DEFAULT_CUTE_AVATAR = CUTE_ANIMAL_AVATARS[0];

export interface ExtendedProfile {
  fullName: string;
  username: string;
  email: string;
  phone: string;
  dob: string;
  gender: string;
  avatarUrl: string | null;
}

export interface HomeProperty {
  id: string;
  homeName: string;
  propertyType: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  pincode?: string;
  familyMembers: number;
  isDefault: boolean;
}

export interface AddressItem {
  id: string;
  addressType: string; // Home, Office, Other
  title: string;
  fullAddress: string;
  landmark?: string;
  city: string;
  state?: string;
  pincode?: string;
  isDefault: boolean;
}

export interface SavedPro {
  id: string;
  name: string;
  profession: string;
  rating: number;
  reviewsCount: number;
  hourlyRate: string;
  avatarUrl?: string;
}

export interface PaymentMethodItem {
  id: string;
  methodType: string; // UPI, Card, Wallet
  providerName: string;
  accountIdentifier: string;
  isDefault: boolean;
}

export interface BookingRecord {
  id: string;
  serviceTitle: string;
  status: 'Upcoming' | 'Completed' | 'Cancelled';
  amount: string;
  date: string;
  technicianName: string;
  address: string;
}

export interface NotificationSettings {
  pushNotif: boolean;
  emailNotif: boolean;
  smsNotif: boolean;
  remindersNotif: boolean;
  offersNotif: boolean;
}

export const DEFAULT_FULL_PROFILE: ExtendedProfile = {
  fullName: '',
  username: '',
  email: '',
  phone: '',
  dob: '',
  gender: '',
  avatarUrl: DEFAULT_CUTE_AVATAR,
};

export const DEFAULT_ADDRESSES: AddressItem[] = [];

export const DEFAULT_HOMES: HomeProperty[] = [];

export const DEFAULT_BOOKINGS: BookingRecord[] = [];

export const DEFAULT_SAVED_PROS: SavedPro[] = [];

export const DEFAULT_PAYMENT_METHODS: PaymentMethodItem[] = [];

export const profileService = {
  /**
   * Fetch full user profile details from Supabase
   */
  /**
   * Fetch full user profile details from Supabase or fallback
   */
  async getFullProfile(userId: string): Promise<ExtendedProfile | null> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            fullName: data.full_name || DEFAULT_FULL_PROFILE.fullName,
            username: data.username || DEFAULT_FULL_PROFILE.username,
            email: data.email || DEFAULT_FULL_PROFILE.email,
            phone: data.phone_number || DEFAULT_FULL_PROFILE.phone,
            dob: data.dob || DEFAULT_FULL_PROFILE.dob,
            gender: data.gender || DEFAULT_FULL_PROFILE.gender,
            avatarUrl: data.avatar_url || DEFAULT_CUTE_AVATAR,
          };
        }
      } catch (err) {
        console.warn('[profileService] Error fetching full profile:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_full_profile');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[profileService] Error reading cached profile:', e);
    }

    return DEFAULT_FULL_PROFILE;
  },

  /**
   * Update full user profile details in Supabase & local storage
   */
  async updateFullProfile(userId: string, profile: Partial<ExtendedProfile>) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            full_name: profile.fullName,
            username: profile.username,
            phone_number: profile.phone,
            dob: profile.dob,
            gender: profile.gender,
            avatar_url: profile.avatarUrl,
            updated_at: new Date().toISOString(),
          });
      } catch (err) {
        console.warn('[profileService] Exception updating full profile:', err);
      }
    }

    try {
      const current = (await this.getFullProfile(userId)) || DEFAULT_FULL_PROFILE;
      const updated = { ...current, ...profile };
      await AsyncStorage.setItem('@fixnest_full_profile', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error saving profile locally:', e);
    }
  },

  /**
   * Update password in Supabase Auth
   */
  async changePassword(newPassword: string) {
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) throw error;
      return data;
    }
    return { message: 'Password updated locally.' };
  },

  /**
   * Fetch user homes
   */
  async getHomes(userId: string): Promise<HomeProperty[]> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('homes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((h: any) => ({
            id: h.id,
            homeName: h.home_name,
            propertyType: h.property_type,
            address: h.address || '',
            city: h.city || '',
            state: h.state || '',
            country: h.country || '',
            pincode: h.pincode || '',
            familyMembers: h.family_members || 1,
            isDefault: h.is_default || false,
          }));
        }
      } catch (err) {
        console.warn('[profileService] Error fetching homes:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_homes');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[profileService] Error reading stored homes:', e);
    }

    return DEFAULT_HOMES;
  },

  /**
   * Add a new Home
   */
  async addHome(userId: string, home: Omit<HomeProperty, 'id'>): Promise<HomeProperty> {
    const newId = 'h_' + Date.now();
    const newRecord: HomeProperty = { id: newId, ...home };

    if (isSupabaseConfigured() && userId) {
      try {
        if (home.isDefault) {
          await supabase.from('homes').update({ is_default: false }).eq('user_id', userId);
        }
        const { data, error } = await supabase
          .from('homes')
          .insert({
            user_id: userId,
            home_name: home.homeName,
            property_type: home.propertyType,
            address: home.address || '',
            city: home.city || '',
            state: home.state || '',
            country: home.country || '',
            pincode: home.pincode || '',
            family_members: home.familyMembers,
            is_default: home.isDefault,
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('[profileService] Error adding home:', err);
      }
    }

    try {
      const current = await this.getHomes(userId);
      const updated = [newRecord, ...current];
      await AsyncStorage.setItem('@fixnest_homes', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error saving homes locally:', e);
    }

    return newRecord;
  },

  /**
   * Update an existing Home
   */
  async updateHome(userId: string, home: HomeProperty) {
    if (isSupabaseConfigured() && userId) {
      try {
        if (home.isDefault) {
          await supabase.from('homes').update({ is_default: false }).eq('user_id', userId);
        }
        await supabase
          .from('homes')
          .update({
            home_name: home.homeName,
            property_type: home.propertyType,
            address: home.address,
            city: home.city,
            state: home.state,
            country: home.country,
            pincode: home.pincode,
            family_members: home.familyMembers,
            is_default: home.isDefault,
          })
          .eq('id', home.id);
      } catch (err) {
        console.warn('[profileService] Error updating home:', err);
      }
    }

    try {
      const current = await this.getHomes(userId);
      const updated = current.map((h) => (h.id === home.id ? home : h));
      await AsyncStorage.setItem('@fixnest_homes', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error updating home locally:', e);
    }
  },

  /**
   * Delete a Home
   */
  async deleteHome(userId: string, homeId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('homes').delete().eq('id', homeId).eq('user_id', userId);
      } catch (err) {
        console.warn('[profileService] Error deleting home:', err);
      }
    }

    try {
      const current = await this.getHomes(userId);
      const updated = current.filter((h) => h.id !== homeId);
      await AsyncStorage.setItem('@fixnest_homes', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error deleting home locally:', e);
    }
  },

  /**
   * Set Default Home
   */
  async setDefaultHome(userId: string, homeId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('homes').update({ is_default: false }).eq('user_id', userId);
        await supabase.from('homes').update({ is_default: true }).eq('id', homeId);
      } catch (err) {
        console.warn('[profileService] Error setting default home:', err);
      }
    }

    try {
      const current = await this.getHomes(userId);
      const updated = current.map((h) => ({ ...h, isDefault: h.id === homeId }));
      await AsyncStorage.setItem('@fixnest_homes', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error setting default home locally:', e);
    }
  },

  /**
   * Fetch user saved addresses
   */
  async getAddresses(userId: string): Promise<AddressItem[]> {
    const targetUserId = userId || 'usr_default';
    if (isSupabaseConfigured() && targetUserId) {
      try {
        const { data, error } = await supabase
          .from('addresses')
          .select('*')
          .eq('user_id', targetUserId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((a: any) => ({
            id: a.id,
            addressType: a.address_type,
            title: a.title || a.address_type,
            fullAddress: a.full_address,
            landmark: a.landmark || '',
            city: a.city,
            state: a.state || '',
            pincode: a.pincode || '',
            isDefault: a.is_default || false,
          }));
        }
      } catch (err) {
        console.warn('[profileService] Error fetching addresses:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_addresses');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('[profileService] Error reading stored addresses:', e);
    }

    try {
      const homes = await this.getHomes(targetUserId);
      if (homes.length > 0) {
        const primaryHome = homes.find((h) => h.isDefault) || homes[0];
        if (primaryHome && (primaryHome.address || primaryHome.city)) {
          return [
            {
              id: 'home_addr_' + primaryHome.id,
              addressType: primaryHome.propertyType || 'Home',
              title: primaryHome.homeName || 'Primary Home',
              fullAddress: primaryHome.address || primaryHome.homeName,
              city: primaryHome.city || '',
              state: primaryHome.state || '',
              pincode: primaryHome.pincode || '',
              isDefault: true,
            },
          ];
        }
      }
    } catch (e) {}

    return DEFAULT_ADDRESSES;
  },

  /**
   * Add a new Address
   */
  async addAddress(userId: string, addr: Omit<AddressItem, 'id'>): Promise<AddressItem> {
    const newId = 'a_' + Date.now();
    const newRecord: AddressItem = { id: newId, ...addr };

    if (isSupabaseConfigured() && userId) {
      try {
        if (addr.isDefault) {
          await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
        }
        const { data, error } = await supabase
          .from('addresses')
          .insert({
            user_id: userId,
            address_type: addr.addressType,
            title: addr.title,
            full_address: addr.fullAddress,
            landmark: addr.landmark || '',
            city: addr.city,
            state: addr.state || '',
            pincode: addr.pincode || '',
            is_default: addr.isDefault,
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('[profileService] Error adding address:', err);
      }
    }

    try {
      const current = await this.getAddresses(userId);
      const updated = [newRecord, ...current];
      await AsyncStorage.setItem('@fixnest_addresses', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error saving address locally:', e);
    }

    return newRecord;
  },

  /**
   * Update an existing Address
   */
  async updateAddress(userId: string, addr: AddressItem) {
    if (isSupabaseConfigured() && userId) {
      try {
        if (addr.isDefault) {
          await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
        }
        await supabase
          .from('addresses')
          .update({
            address_type: addr.addressType,
            title: addr.title,
            full_address: addr.fullAddress,
            landmark: addr.landmark,
            city: addr.city,
            state: addr.state,
            pincode: addr.pincode,
            is_default: addr.isDefault,
          })
          .eq('id', addr.id);
      } catch (err) {
        console.warn('[profileService] Error updating address:', err);
      }
    }

    try {
      const current = await this.getAddresses(userId);
      const updated = current.map((a) => (a.id === addr.id ? addr : a));
      await AsyncStorage.setItem('@fixnest_addresses', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error updating address locally:', e);
    }
  },

  /**
   * Delete an Address
   */
  async deleteAddress(userId: string, addrId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('addresses').delete().eq('id', addrId).eq('user_id', userId);
      } catch (err) {
        console.warn('[profileService] Error deleting address:', err);
      }
    }

    try {
      const current = await this.getAddresses(userId);
      const updated = current.filter((a) => a.id !== addrId);
      await AsyncStorage.setItem('@fixnest_addresses', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error deleting address locally:', e);
    }
  },

  /**
   * Set Default Address
   */
  async setDefaultAddress(userId: string, addrId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('addresses').update({ is_default: false }).eq('user_id', userId);
        await supabase.from('addresses').update({ is_default: true }).eq('id', addrId);
      } catch (err) {
        console.warn('[profileService] Error setting default address:', err);
      }
    }

    try {
      const current = await this.getAddresses(userId);
      const updated = current.map((a) => ({ ...a, isDefault: a.id === addrId }));
      await AsyncStorage.setItem('@fixnest_addresses', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error setting default address locally:', e);
    }
  },

  /**
   * Fetch saved professionals
   */
  async getSavedProfessionals(userId: string): Promise<SavedPro[]> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('saved_professionals')
          .select('*')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          return data.map((p: any) => ({
            id: p.id,
            name: p.name,
            profession: p.profession,
            rating: Number(p.rating),
            reviewsCount: p.reviews_count,
            hourlyRate: p.hourly_rate,
            avatarUrl: p.avatar_url,
          }));
        }
      } catch (err) {
        console.warn('[profileService] Error fetching saved pros:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_saved_pros');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[profileService] Error reading saved pros:', e);
    }

    return DEFAULT_SAVED_PROS;
  },

  /**
   * Delete a saved professional
   */
  async removeSavedProfessional(userId: string, proId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('saved_professionals').delete().eq('id', proId).eq('user_id', userId);
      } catch (err) {
        console.warn('[profileService] Error removing professional:', err);
      }
    }

    try {
      const current = await this.getSavedProfessionals(userId);
      const updated = current.filter((p) => p.id !== proId);
      await AsyncStorage.setItem('@fixnest_saved_pros', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error removing saved pro locally:', e);
    }
  },

  /**
   * Fetch payment methods
   */
  async getPaymentMethods(userId: string): Promise<PaymentMethodItem[]> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('payment_methods')
          .select('*')
          .eq('user_id', userId);

        if (!error && data && data.length > 0) {
          return data.map((pm: any) => ({
            id: pm.id,
            methodType: pm.method_type,
            providerName: pm.provider_name,
            accountIdentifier: pm.account_identifier,
            isDefault: pm.is_default,
          }));
        }
      } catch (err) {
        console.warn('[profileService] Error fetching payment methods:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_payment_methods');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[profileService] Error reading payment methods:', e);
    }

    return DEFAULT_PAYMENT_METHODS;
  },

  /**
   * Add a new payment method
   */
  async addPaymentMethod(userId: string, pm: Omit<PaymentMethodItem, 'id'>): Promise<PaymentMethodItem> {
    const newId = 'pm_' + Date.now();
    const newRecord: PaymentMethodItem = { id: newId, ...pm };

    if (isSupabaseConfigured() && userId) {
      try {
        if (pm.isDefault) {
          await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', userId);
        }
        const { data, error } = await supabase
          .from('payment_methods')
          .insert({
            user_id: userId,
            method_type: pm.methodType,
            provider_name: pm.providerName,
            account_identifier: pm.accountIdentifier,
            is_default: pm.isDefault,
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('[profileService] Error adding payment method:', err);
      }
    }

    try {
      const current = await this.getPaymentMethods(userId);
      const updated = [newRecord, ...current];
      await AsyncStorage.setItem('@fixnest_payment_methods', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error saving payment method locally:', e);
    }

    return newRecord;
  },

  /**
   * Delete a payment method
   */
  async deletePaymentMethod(userId: string, pmId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('payment_methods').delete().eq('id', pmId).eq('user_id', userId);
      } catch (err) {
        console.warn('[profileService] Error deleting payment method:', err);
      }
    }

    try {
      const current = await this.getPaymentMethods(userId);
      const updated = current.filter((pm) => pm.id !== pmId);
      await AsyncStorage.setItem('@fixnest_payment_methods', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error deleting payment method locally:', e);
    }
  },

  /**
   * Set default payment method
   */
  async setDefaultPaymentMethod(userId: string, pmId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('payment_methods').update({ is_default: false }).eq('user_id', userId);
        await supabase.from('payment_methods').update({ is_default: true }).eq('id', pmId);
      } catch (err) {
        console.warn('[profileService] Error setting default payment method:', err);
      }
    }

    try {
      const current = await this.getPaymentMethods(userId);
      const updated = current.map((pm) => ({ ...pm, isDefault: pm.id === pmId }));
      await AsyncStorage.setItem('@fixnest_payment_methods', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error setting default payment method locally:', e);
    }
  },

  /**
   * Fetch user bookings
   */
  async getBookings(userId: string): Promise<BookingRecord[]> {
    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        if (!error && data && data.length > 0) {
          return data.map((b: any) => ({
            id: b.id,
            serviceTitle: b.service_title,
            status: b.status as any,
            amount: b.amount,
            date: b.date,
            technicianName: b.technician_name || 'Assigned Technician',
            address: b.address || 'Default Address',
          }));
        }
      } catch (err) {
        console.warn('[profileService] Error fetching bookings:', err);
      }
    }

    try {
      const stored = await AsyncStorage.getItem('@fixnest_bookings');
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[profileService] Error reading stored bookings:', e);
    }

    return DEFAULT_BOOKINGS;
  },

  /**
   * Add a new service booking
   */
  async addBooking(userId: string, booking: Omit<BookingRecord, 'id'>): Promise<BookingRecord> {
    const newId = 'bk_' + Date.now();
    const newRecord: BookingRecord = { id: newId, ...booking };

    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('bookings')
          .insert({
            user_id: userId,
            service_title: booking.serviceTitle,
            status: booking.status,
            amount: booking.amount,
            date: booking.date,
            technician_name: booking.technicianName,
            address: booking.address,
          })
          .select()
          .single();

        if (!error && data) {
          newRecord.id = data.id;
        }
      } catch (err) {
        console.warn('[profileService] Error adding booking to Supabase:', err);
      }
    }

    try {
      const current = await this.getBookings(userId);
      const updated = [newRecord, ...current];
      await AsyncStorage.setItem('@fixnest_bookings', JSON.stringify(updated));
    } catch (e) {
      console.warn('[profileService] Error saving booking locally:', e);
    }

    return newRecord;
  },

  /**
   * Fetch user notification settings
   */
  async getSettings(userId: string): Promise<NotificationSettings> {
    const defaults: NotificationSettings = {
      pushNotif: true,
      emailNotif: true,
      smsNotif: false,
      remindersNotif: true,
      offersNotif: false,
    };

    if (isSupabaseConfigured() && userId) {
      try {
        const { data, error } = await supabase
          .from('user_settings')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (!error && data) {
          return {
            pushNotif: data.push_notif ?? true,
            emailNotif: data.email_notif ?? true,
            smsNotif: data.sms_notif ?? false,
            remindersNotif: data.reminders_notif ?? true,
            offersNotif: data.offers_notif ?? false,
          };
        }
      } catch (err) {
        console.warn('[profileService] Error fetching user settings:', err);
      }
    }

    return defaults;
  },

  /**
   * Save user notification settings
   */
  async saveSettings(userId: string, settings: NotificationSettings) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('user_settings').upsert({
          user_id: userId,
          push_notif: settings.pushNotif,
          email_notif: settings.emailNotif,
          sms_notif: settings.smsNotif,
          reminders_notif: settings.remindersNotif,
          offers_notif: settings.offersNotif,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('[profileService] Error saving settings:', err);
      }
    }
  },

  /**
   * Export all user data as JSON file for download
   */
  async exportUserDataJSON(userId: string, email: string) {
    const [profile, homes, addresses, pros, payments, bookings, settings] = await Promise.all([
      this.getFullProfile(userId),
      this.getHomes(userId),
      this.getAddresses(userId),
      this.getSavedProfessionals(userId),
      this.getPaymentMethods(userId),
      this.getBookings(userId),
      this.getSettings(userId),
    ]);

    const exportData = {
      exportDate: new Date().toISOString(),
      user: { userId, email, ...profile },
      homes,
      addresses,
      savedProfessionals: pros,
      paymentMethods: payments,
      bookings,
      settings,
    };

    const jsonStr = JSON.stringify(exportData, null, 2);

    if (typeof window !== 'undefined' && window.document) {
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `fixnest-user-data-${Date.now()}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
    return exportData;
  },

  /**
   * Delete User Account
   */
  async deleteUserAccount(userId: string) {
    if (isSupabaseConfigured() && userId) {
      try {
        await supabase.from('user_profiles').delete().eq('id', userId);
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[profileService] Error deleting user account:', err);
      }
    }
  },

  /**
   * Fetch existing user app rating from Supabase
   */
  async getUserAppRating(userId: string): Promise<{ id?: string; rating: number; feedback: string } | null> {
    if (!userId || !isSupabaseConfigured()) return null;
    try {
      const { data, error } = await supabase
        .from('app_ratings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        return {
          id: data.id,
          rating: Number(data.rating),
          feedback: data.feedback || '',
        };
      }
    } catch (err) {
      console.warn('[profileService] Exception loading app_ratings:', err);
    }
    return null;
  },

  /**
   * Submit or update user app rating in Supabase
   */
  async submitAppRating(userId: string, rating: number, feedback?: string): Promise<boolean> {
    if (!userId) return false;
    if (isSupabaseConfigured()) {
      try {
        const { error } = await supabase.from('app_ratings').upsert(
          {
            user_id: userId,
            rating,
            feedback: feedback?.trim() || null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id' }
        );

        if (error) {
          console.warn('[profileService] Error submitting app rating:', error.message);
          return false;
        }
        return true;
      } catch (err) {
        console.warn('[profileService] Exception submitting app rating:', err);
        return false;
      }
    }
    return true;
  },
};
