import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  ProfessionalProfile,
  BookingRequest,
  BookingRequestStatus,
  ChatMessage,
  ProRating,
} from '../types/professional';

const KEYS = {
  PROFESSIONALS: '@fixnest_marketplace_professionals',
  REQUESTS: '@fixnest_marketplace_requests',
  CHATS: '@fixnest_marketplace_chats',
  RATINGS: '@fixnest_marketplace_ratings',
  MY_PRO_ID: '@fixnest_my_pro_id',
  DEVICE_ID: '@fixnest_device_id',
};

export const getDeviceId = async (): Promise<string> => {
  try {
    let id = await AsyncStorage.getItem(KEYS.DEVICE_ID);
    if (!id) {
      id = 'dev_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      await AsyncStorage.setItem(KEYS.DEVICE_ID, id);
    }
    return id;
  } catch (e) {
    return 'dev_fallback';
  }
};

const BACKEND_API = 'http://localhost:8000/api';
const DEFAULT_PRO_IDS = new Set(['pro_1', 'pro_2', 'pro_3', 'pro_4', 'pro_5']);

let syncChannel: any = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    syncChannel = new (window as any).BroadcastChannel('fixnest_global_sync');
  } catch (e) {}
}

// ─── Core Service ─────────────────────────────────────────────────────────────
export const professionalMarketplaceService = {

  // ── Professionals CRUD ────────────────────────────────────────────────────

  async getAllProfessionals(): Promise<ProfessionalProfile[]> {
    let remotePros: ProfessionalProfile[] = [];
    try {
      const res = await fetch(`${BACKEND_API}/professionals`, { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          remotePros = data.filter((p: any) => !DEFAULT_PRO_IDS.has(p.id));
        }
      }
    } catch (e) {
      // Backend offline or unreachable
    }

    try {
      const stored = await AsyncStorage.getItem(KEYS.PROFESSIONALS);
      let localPros: ProfessionalProfile[] = stored ? JSON.parse(stored) : [];
      localPros = localPros.filter((p) => !DEFAULT_PRO_IDS.has(p.id));

      // Push any local pros missing on remote backend to sync across all browsers
      const remoteIds = new Set(remotePros.map((p) => p.id));
      const unsyncedLocals = localPros.filter((p) => !remoteIds.has(p.id));
      if (unsyncedLocals.length > 0) {
        for (const lp of unsyncedLocals) {
          try {
            await fetch(`${BACKEND_API}/professionals`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(lp),
            });
            remotePros.push(lp);
          } catch (err) {}
        }
      }

      // Merge remote + local pros by unique ID
      const proMap = new Map<string, ProfessionalProfile>();
      localPros.forEach((p) => proMap.set(p.id, p));
      remotePros.forEach((p) => proMap.set(p.id, p));

      const merged = Array.from(proMap.values());
      await AsyncStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(merged));
      return merged;
    } catch (e) {
      console.warn('[marketplace] Error reading professionals:', e);
      return remotePros;
    }
  },

  async registerProfessional(profile: ProfessionalProfile): Promise<void> {
    try {
      const currentDeviceId = await getDeviceId();
      const profileToSave = { ...profile, deviceId: profile.deviceId || currentDeviceId };

      const all = await this.getAllProfessionals();
      const exists = all.findIndex((p) => p.id === profileToSave.id);
      let updated: ProfessionalProfile[];
      if (exists >= 0) {
        updated = all.map((p) => (p.id === profileToSave.id ? profileToSave : p));
      } else {
        updated = [profileToSave, ...all];
      }
      await AsyncStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(updated));

      // Push to backend server for global cross-browser persistence
      try {
        await fetch(`${BACKEND_API}/professionals`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(profileToSave),
        });
      } catch (err) {
        console.warn('[marketplace] Backend sync error:', err);
      }

      // Broadcast to all open tabs/windows
      if (syncChannel) {
        syncChannel.postMessage({ type: 'PRO_REGISTERED', profile: profileToSave });
      }
    } catch (e) {
      console.warn('[marketplace] Error registering professional:', e);
    }
  },

  async updateProfessionalProfile(id: string, patch: Partial<ProfessionalProfile>): Promise<void> {
    try {
      const all = await this.getAllProfessionals();
      const target = all.find((p) => p.id === id);
      const updated = all.map((p) => (p.id === id ? { ...p, ...patch } : p));
      await AsyncStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(updated));

      if (target) {
        const fullUpdated = { ...target, ...patch };
        try {
          await fetch(`${BACKEND_API}/professionals`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(fullUpdated),
          });
        } catch (err) {}

        if (syncChannel) {
          syncChannel.postMessage({ type: 'PRO_UPDATED', profile: fullUpdated });
        }
      }
    } catch (e) {
      console.warn('[marketplace] Error updating professional:', e);
    }
  },

  async getProfessionalById(id: string): Promise<ProfessionalProfile | null> {
    const all = await this.getAllProfessionals();
    return all.find((p) => p.id === id) || null;
  },

  /**
   * Get registered professionals in the app.
   * Returns ONLY registered professional profiles, no default/mock data.
   */
  async getNearbyProfessionals(
    serviceId?: string,
    city?: string,
  ): Promise<{ professionals: ProfessionalProfile[]; isDemo: boolean }> {
    const all = await this.getAllProfessionals();

    let filtered = all.filter((p) => p.availability !== false);

    if (serviceId) {
      const bySvc = filtered.filter((p) => p.services && p.services.includes(serviceId));
      if (bySvc.length > 0) {
        filtered = bySvc;
      }
    }

    if (city) {
      const cityLower = city.toLowerCase();
      const byCity = filtered.filter(
        (p) =>
          (p.currentLocation?.city && p.currentLocation.city.toLowerCase().includes(cityLower)) ||
          (p.workingAreas && p.workingAreas.some((a) => a.toLowerCase().includes(cityLower))),
      );
      if (byCity.length > 0) {
        filtered = byCity;
      }
    }

    // Sort by rating desc, completedJobs desc
    filtered.sort((a, b) => b.rating - a.rating || b.completedJobs - a.completedJobs);

    const finalPros = filtered.length > 0 ? filtered : all;
    return { professionals: finalPros, isDemo: false };
  },

  // ── Booking Requests ──────────────────────────────────────────────────────

  async getAllRequests(): Promise<BookingRequest[]> {
    try {
      const stored = await AsyncStorage.getItem(KEYS.REQUESTS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[marketplace] Error reading requests:', e);
    }
    return [];
  },

  async createBookingRequest(
    request: Omit<BookingRequest, 'id' | 'createdAt' | 'status'> & {
      professionalId?: string | null;
    },
  ): Promise<BookingRequest> {
    const newReq: BookingRequest = {
      ...request,
      id: 'req_' + Date.now(),
      status: 'pending',
      professionalId: request.professionalId || null,
      createdAt: new Date().toISOString(),
    };
    try {
      const all = await this.getAllRequests();
      await AsyncStorage.setItem(KEYS.REQUESTS, JSON.stringify([newReq, ...all]));
    } catch (e) {
      console.warn('[marketplace] Error creating request:', e);
    }
    return newReq;
  },

  async getRequestsForProfessional(proId: string): Promise<BookingRequest[]> {
    const all = await this.getAllRequests();
    const pro = await this.getProfessionalById(proId);
    if (!pro) return [];
    return all.filter(
      (r) =>
        r.professionalId === proId ||
        (!r.professionalId && r.status === 'pending' && pro.services.includes(r.serviceId)),
    );
  },

  async respondToRequest(
    requestId: string,
    status: BookingRequestStatus,
    professionalId: string,
    professionalName: string,
  ): Promise<void> {
    try {
      const all = await this.getAllRequests();
      const updated = all.map((r) => {
        if (r.id === requestId) {
          const patch: Partial<BookingRequest> = {
            status,
            professionalId,
            professionalName,
          };
          if (status === 'accepted') patch.acceptedAt = new Date().toISOString();
          if (status === 'completed') patch.completedAt = new Date().toISOString();
          return { ...r, ...patch };
        }
        return r;
      });
      await AsyncStorage.setItem(KEYS.REQUESTS, JSON.stringify(updated));

      // System message to chat
      if (status === 'accepted') {
        await this.sendChatMessage({
          bookingId: requestId,
          senderId: professionalId,
          senderType: 'professional',
          senderName: professionalName,
          message: `✅ ${professionalName} has accepted your booking request. They will contact you shortly.`,
          type: 'system',
        });
      } else if (status === 'rejected') {
        await this.sendChatMessage({
          bookingId: requestId,
          senderId: professionalId,
          senderType: 'professional',
          senderName: professionalName,
          message: `❌ ${professionalName} is unable to take this booking at the moment.`,
          type: 'system',
        });
      }
    } catch (e) {
      console.warn('[marketplace] Error responding to request:', e);
    }
  },

  async markRequestCompleted(requestId: string, proId: string): Promise<void> {
    try {
      const all = await this.getAllRequests();
      const updated = all.map((r) =>
        r.id === requestId && r.professionalId === proId
          ? { ...r, status: 'completed' as BookingRequestStatus, completedAt: new Date().toISOString() }
          : r,
      );
      await AsyncStorage.setItem(KEYS.REQUESTS, JSON.stringify(updated));

      // Update pro stats
      const pro = await this.getProfessionalById(proId);
      if (pro) {
        await this.updateProfessionalProfile(proId, {
          completedJobs: pro.completedJobs + 1,
        });
      }
    } catch (e) {
      console.warn('[marketplace] Error marking completed:', e);
    }
  },

  async getRequestsForUser(userId: string): Promise<BookingRequest[]> {
    const all = await this.getAllRequests();
    return all.filter((r) => r.userId === userId);
  },

  // ── Ratings ──────────────────────────────────────────────────────────────

  async getAllRatings(): Promise<ProRating[]> {
    try {
      const stored = await AsyncStorage.getItem(KEYS.RATINGS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[marketplace] Error reading ratings:', e);
    }
    return [];
  },

  async getRatingsForProfessional(proId: string): Promise<ProRating[]> {
    const all = await this.getAllRatings();
    return all.filter((r) => r.proId === proId).sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  async addRatingForProfessional(
    ratingData: Omit<ProRating, 'id' | 'createdAt'>,
  ): Promise<ProRating> {
    const newRating: ProRating = {
      ...ratingData,
      id: 'rate_' + Date.now(),
      createdAt: new Date().toISOString(),
    };
    try {
      const all = await this.getAllRatings();
      const updated = [newRating, ...all];
      await AsyncStorage.setItem(KEYS.RATINGS, JSON.stringify(updated));

      // Update pro's overall rating average
      const proRatings = updated.filter((r) => r.proId === ratingData.proId);
      if (proRatings.length > 0) {
        const sum = proRatings.reduce((acc, r) => acc + r.rating, 0);
        const avg = parseFloat((sum / proRatings.length).toFixed(1));
        await this.updateProfessionalProfile(ratingData.proId, { rating: avg });
      }
    } catch (e) {
      console.warn('[marketplace] Error adding rating:', e);
    }
    return newRating;
  },

  // ── Chat ──────────────────────────────────────────────────────────────────

  async getAllChats(): Promise<ChatMessage[]> {
    try {
      const stored = await AsyncStorage.getItem(KEYS.CHATS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('[marketplace] Error reading chats:', e);
    }
    return [];
  },

  async getChatsForBooking(bookingId: string): Promise<ChatMessage[]> {
    const all = await this.getAllChats();
    if (!bookingId) return [];

    const requests = await this.getAllRequests();
    const targetReq = requests.find((r) => r.id === bookingId);

    const relatedKeys = new Set<string>([bookingId]);

    if (targetReq && targetReq.userId && targetReq.professionalId) {
      relatedKeys.add(`chat_${targetReq.userId}_${targetReq.professionalId}`);
    } else if (bookingId.startsWith('chat_')) {
      const parts = bookingId.split('_');
      if (parts.length >= 3) {
        const uId = parts[1];
        const pId = parts.slice(2).join('_');
        const matchingReqs = requests.filter(
          (r) => (r.userId === uId || uId === 'usr') && r.professionalId === pId,
        );
        matchingReqs.forEach((r) => relatedKeys.add(r.id));
      }
    }

    return all
      .filter((m) => relatedKeys.has(m.bookingId))
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  async sendChatMessage(
    msg: Omit<ChatMessage, 'id' | 'timestamp' | 'read'>,
  ): Promise<ChatMessage> {
    const newMsg: ChatMessage = {
      ...msg,
      id: 'msg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      read: false,
    };
    try {
      const all = await this.getAllChats();
      await AsyncStorage.setItem(KEYS.CHATS, JSON.stringify([...all, newMsg]));
    } catch (e) {
      console.warn('[marketplace] Error sending message:', e);
    }
    return newMsg;
  },

  async markChatsRead(bookingId: string, readerId: string): Promise<void> {
    try {
      const all = await this.getAllChats();
      const updated = all.map((m) =>
        m.bookingId === bookingId && m.senderId !== readerId ? { ...m, read: true } : m,
      );
      await AsyncStorage.setItem(KEYS.CHATS, JSON.stringify(updated));
    } catch (e) {
      console.warn('[marketplace] Error marking chats read:', e);
    }
  },

  async getUnreadCountForPro(proId: string, requestIds: string[]): Promise<number> {
    const all = await this.getAllChats();
    return all.filter(
      (m) =>
        requestIds.includes(m.bookingId) &&
        m.senderId !== proId &&
        !m.read,
    ).length;
  },

  async getProfilesByUserId(userId: string): Promise<ProfessionalProfile[]> {
    const all = await this.getAllProfessionals();
    const currentDeviceId = await getDeviceId();
    
    // Assign missing deviceId to profiles created by this user/device for backward compatibility.
    let changed = false;
    const userProfiles = all.filter(
      (p) => {
        if (!p.deviceId) {
           p.deviceId = currentDeviceId;
           changed = true;
        }
        return p.deviceId === currentDeviceId && (p.userId === userId || p.userId === 'usr_default' || !p.userId);
      }
    );
    
    if (changed) {
       await AsyncStorage.setItem(KEYS.PROFESSIONALS, JSON.stringify(all));
       for (const p of userProfiles) {
         try {
           await fetch(`${BACKEND_API}/professionals`, {
             method: 'POST',
             headers: { 'Content-Type': 'application/json' },
             body: JSON.stringify(p),
           });
         } catch (err) {}
       }
    }
    
    return userProfiles.length > 0 ? userProfiles : [];
  },

  // ── My Pro ID & User-Pro Mapping ──────────────────────────────────────────

  async saveActiveProIdForUser(userId: string, proId: string): Promise<void> {
    if (userId) {
      await AsyncStorage.setItem(`${KEYS.MY_PRO_ID}_${userId}`, proId);
    }
    await AsyncStorage.setItem(KEYS.MY_PRO_ID, proId);
  },

  async getActiveProIdForUser(userId?: string): Promise<string | null> {
    let proId = null;
    if (userId) {
      proId = await AsyncStorage.getItem(`${KEYS.MY_PRO_ID}_${userId}`);
    }
    if (!proId) {
      proId = await AsyncStorage.getItem(KEYS.MY_PRO_ID);
    }

    if (proId) {
      const currentDeviceId = await getDeviceId();
      const profile = await this.getProfessionalById(proId);
      if (profile && profile.deviceId === currentDeviceId) {
        return proId;
      }
    }
    return null;
  },

  async saveMyProId(id: string, userId?: string): Promise<void> {
    await this.saveActiveProIdForUser(userId || '', id);
  },

  async getMyProId(userId?: string): Promise<string | null> {
    return this.getActiveProIdForUser(userId);
  },

  async clearMyProId(): Promise<void> {
    // Soft clear — DO NOT delete stored user pro profiles or user-pro mapping!
  },
};
