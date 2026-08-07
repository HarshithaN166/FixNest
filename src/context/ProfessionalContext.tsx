import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppRole,
  ProfessionalProfile,
  BookingRequest,
  BookingRequestStatus,
  ChatMessage,
} from '../types/professional';
import { professionalMarketplaceService } from '../services/professionalMarketplaceService';
import { useAuth } from '../hooks/useAuth';

const ROLE_KEY = '@fixnest_chosen_role';

interface ProfessionalContextValue {
  role: AppRole;
  setRole: (role: AppRole) => Promise<void>;
  clearRole: () => Promise<void>;
  switchToUser: () => Promise<void>;

  proProfile: ProfessionalProfile | null;
  setProProfile: (profile: ProfessionalProfile) => Promise<void>;
  updateProProfile: (patch: Partial<ProfessionalProfile>) => Promise<void>;

  userExistingProfiles: ProfessionalProfile[];
  showProfileChoiceModal: boolean;
  setShowProfileChoiceModal: (show: boolean) => void;
  selectExistingProfile: (profile: ProfessionalProfile) => Promise<void>;
  createNewProfile: () => void;
  checkUserExistingProfiles: () => Promise<ProfessionalProfile[]>;

  requests: BookingRequest[];
  refreshRequests: () => Promise<void>;
  respondToRequest: (
    requestId: string,
    status: BookingRequestStatus,
  ) => Promise<void>;

  chats: ChatMessage[];
  refreshChats: () => Promise<void>;
  sendMessage: (
    bookingId: string,
    message: string,
  ) => Promise<void>;

  unreadMessages: number;
  isRoleLoading: boolean;
}

const ProfessionalContext = createContext<ProfessionalContextValue | null>(null);

export const useProfessional = () => {
  const ctx = useContext(ProfessionalContext);
  if (!ctx) throw new Error('useProfessional must be used inside ProfessionalProvider');
  return ctx;
};

export const ProfessionalProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const userId = user?.id || 'usr_default';

  const [role, setRoleState] = useState<AppRole>(null);
  const [proProfile, setProProfileState] = useState<ProfessionalProfile | null>(null);
  const [userExistingProfiles, setUserExistingProfiles] = useState<ProfessionalProfile[]>([]);
  const [showProfileChoiceModal, setShowProfileChoiceModal] = useState<boolean>(false);
  const [requests, setRequests] = useState<BookingRequest[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [isRoleLoading, setIsRoleLoading] = useState(true);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const init = async () => {
      try {
        // Restore saved role
        const savedRole = (await AsyncStorage.getItem(ROLE_KEY)) as AppRole;
        setRoleState(savedRole);

        // Fetch existing profiles owned by this user
        const existing = await professionalMarketplaceService.getProfilesByUserId(userId);
        setUserExistingProfiles(existing);

        // Restore active pro profile
        if (savedRole === 'professional') {
          const activeId = await professionalMarketplaceService.getActiveProIdForUser(userId);
          if (activeId) {
            const profile = await professionalMarketplaceService.getProfessionalById(activeId);
            if (profile) {
              setProProfileState(profile);
              await loadRequestsForPro(profile.id);
              await loadChatsForPro(profile.id);
            }
          }
          if (existing.length > 0) {
            setShowProfileChoiceModal(true);
          }
        }
      } catch (e) {
        console.warn('[ProfessionalContext] Init error:', e);
      } finally {
        setIsRoleLoading(false);
      }
    };
    init();
  }, [userId]);

  // Check user profiles on demand
  const checkUserExistingProfiles = useCallback(async (): Promise<ProfessionalProfile[]> => {
    const existing = await professionalMarketplaceService.getProfilesByUserId(userId);
    setUserExistingProfiles(existing);
    return existing;
  }, [userId]);

  // ── Role ───────────────────────────────────────────────────────────────────
  const setRole = useCallback(async (r: AppRole) => {
    setRoleState(r);
    if (r) {
      await AsyncStorage.setItem(ROLE_KEY, r);
    } else {
      await AsyncStorage.removeItem(ROLE_KEY);
    }

    if (r === 'professional') {
      const existing = await professionalMarketplaceService.getProfilesByUserId(userId);
      setUserExistingProfiles(existing);
      const activeId = await professionalMarketplaceService.getActiveProIdForUser(userId);
      if (activeId) {
        const profile = await professionalMarketplaceService.getProfessionalById(activeId);
        if (profile) {
          setProProfileState(profile);
          await loadRequestsForPro(profile.id);
          await loadChatsForPro(profile.id);
        }
      }
      if (existing.length > 0) {
        setShowProfileChoiceModal(true);
      }
    }
  }, [userId]);

  const clearRole = useCallback(async () => {
    setRoleState(null);
    setProProfileState(null);
    setShowProfileChoiceModal(false);
    await AsyncStorage.removeItem(ROLE_KEY);
    // Soft clear — DO NOT delete stored user pro profiles or user-pro mapping!
  }, []);

  // Switch to user mode without clearing the professional profile
  const switchToUser = useCallback(async () => {
    setRoleState('user');
    await AsyncStorage.setItem(ROLE_KEY, 'user');
  }, []);

  // ── Profile Selection & Creation ──────────────────────────────────────────
  const selectExistingProfile = useCallback(async (profile: ProfessionalProfile) => {
    setProProfileState(profile);
    await professionalMarketplaceService.saveActiveProIdForUser(userId, profile.id);
    await loadRequestsForPro(profile.id);
    await loadChatsForPro(profile.id);
    setShowProfileChoiceModal(false);
  }, [userId]);

  const createNewProfile = useCallback(() => {
    setProProfileState(null);
    setShowProfileChoiceModal(false);
  }, []);

  // ── Professional Profile CRUD ─────────────────────────────────────────────
  const setProProfile = useCallback(async (profile: ProfessionalProfile) => {
    const profileWithUser: ProfessionalProfile = {
      ...profile,
      userId: profile.userId || userId,
    };
    setProProfileState(profileWithUser);
    await professionalMarketplaceService.registerProfessional(profileWithUser);
    await professionalMarketplaceService.saveActiveProIdForUser(userId, profileWithUser.id);

    // Refresh user profiles list
    const updated = await professionalMarketplaceService.getProfilesByUserId(userId);
    setUserExistingProfiles(updated);

    await loadRequestsForPro(profileWithUser.id);
  }, [userId]);

  const updateProProfile = useCallback(async (patch: Partial<ProfessionalProfile>) => {
    if (!proProfile) return;
    const updated: ProfessionalProfile = { ...proProfile, ...patch, userId: proProfile.userId || userId };
    setProProfileState(updated);
    await professionalMarketplaceService.updateProfessionalProfile(proProfile.id, patch);
    await professionalMarketplaceService.registerProfessional(updated);

    // Refresh user profiles list
    const existing = await professionalMarketplaceService.getProfilesByUserId(userId);
    setUserExistingProfiles(existing);
  }, [proProfile, userId]);

  // ── Requests ───────────────────────────────────────────────────────────────
  const loadRequestsForPro = async (proId: string) => {
    const reqs = await professionalMarketplaceService.getRequestsForProfessional(proId);
    setRequests(reqs);
  };

  const refreshRequests = useCallback(async () => {
    if (!proProfile) return;
    await loadRequestsForPro(proProfile.id);
  }, [proProfile]);

  const respondToRequest = useCallback(
    async (requestId: string, status: BookingRequestStatus) => {
      if (!proProfile) return;
      await professionalMarketplaceService.respondToRequest(
        requestId,
        status,
        proProfile.id,
        proProfile.name,
      );
      if (status === 'completed') {
        await professionalMarketplaceService.markRequestCompleted(requestId, proProfile.id);
        // Reload profile to get updated completedJobs
        const updated = await professionalMarketplaceService.getProfessionalById(proProfile.id);
        if (updated) setProProfileState(updated);
      }
      await loadRequestsForPro(proProfile.id);
      await loadChats();
    },
    [proProfile],
  );

  // ── Chats ──────────────────────────────────────────────────────────────────
  const loadChatsForPro = async (proId: string) => {
    const allChats = await professionalMarketplaceService.getAllChats();
    setChats(allChats);
  };

  const loadChats = async () => {
    const allChats = await professionalMarketplaceService.getAllChats();
    setChats(allChats);
  };

  const refreshChats = useCallback(async () => {
    await loadChats();
  }, []);

  const sendMessage = useCallback(
    async (bookingId: string, message: string) => {
      if (!proProfile) return;
      await professionalMarketplaceService.sendChatMessage({
        bookingId,
        senderId: proProfile.id,
        senderType: 'professional',
        senderName: proProfile.name,
        message,
        type: 'text',
      });
      await loadChats();
    },
    [proProfile],
  );

  const unreadMessages = chats.filter(
    (m) =>
      proProfile &&
      m.senderType === 'user' &&
      !m.read &&
      requests.some((r) => r.id === m.bookingId),
  ).length;

  return (
    <ProfessionalContext.Provider
      value={{
        role,
        setRole,
        clearRole,
        switchToUser,
        proProfile,
        setProProfile,
        updateProProfile,
        userExistingProfiles,
        showProfileChoiceModal,
        setShowProfileChoiceModal,
        selectExistingProfile,
        createNewProfile,
        checkUserExistingProfiles,
        requests,
        refreshRequests,
        respondToRequest,
        chats,
        refreshChats,
        sendMessage,
        unreadMessages,
        isRoleLoading,
      }}
    >
      {children}
    </ProfessionalContext.Provider>
  );
};
