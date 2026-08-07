import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
  Alert,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { Colors } from '../../constants/colors';
import { useNotifications } from '../../context/NotificationContext';
import {
  aiBackendService,
  ChatMessageItem,
  AttachmentItem,
} from '../../services/aiBackendService';
import {
  Sparkles,
  ArrowLeft,
  Send,
  Camera,
  FileText,
  Video,
  Mic,
  MicOff,
  Image as ImageIcon,
  Paperclip,
  X,
  Bot,
  User,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Download,
  Info,
  Maximize2,
  RefreshCw,
  Zap,
} from 'lucide-react-native';

const SUGGESTIONS = [
  { id: '1', label: '💧 Kitchen Sink Leaking', prompt: 'My kitchen sink is leaking water underneath the cabinet. How do I diagnose and fix it?' },
  { id: '2', label: '⚡ Tripped Breaker Switch', prompt: 'The circuit breaker in my living room tripped and won’t reset. Is it safe to try again?' },
  { id: '3', label: '❄️ AC Unit Not Cooling', prompt: 'My AC is blowing warm air and making a humming sound. What could be the issue?' },
  { id: '4', label: '🏠 Roof Leak Estimate', prompt: 'I noticed water spots on my ceiling after heavy rain. How much does a roof leak repair cost?' },
];

interface AskAIScreenProps {
  onBack?: () => void;
}

export const AskAIScreen: React.FC<AskAIScreenProps> = ({ onBack }) => {
  const { addNotification } = useNotifications();
  const [messages, setMessages] = useState<ChatMessageItem[]>([
    {
      id: 'welcome_1',
      role: 'assistant',
      content: `👋 **Welcome to FixNest AI Diagnostic Assistant!**

I can help you diagnose home repair issues, explain safety procedures, calculate professional cost estimates, and generate technical diagrams.

**Upload options:**
• 📷 Diagnostic Photos
• 📄 Home Manuals & Estimates (PDF, DOCX, TXT)
• 📹 Inspection Video Clips
• 🎙️ Voice Notes & Audio Descriptions
• 🎨 AI Diagram Generation

How can I assist you with your home today?`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      providerUsed: 'FixNest AI Gateway',
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeProviders, setActiveProviders] = useState<string[]>(['Gemini / GPT-4o / Claude / Groq']);

  // Attachment states
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [recordTime, setRecordTime] = useState(0);
  const [zoomedImage, setZoomedImage] = useState<string | null>(null);

  const scrollViewRef = useRef<ScrollView>(null);
  const timerRef = useRef<any>(null);

  useEffect(() => {
    checkGatewayHealth();
  }, []);

  const checkGatewayHealth = async () => {
    const health = await aiBackendService.checkHealth();
    if (health.providers && health.providers.length > 0) {
      setActiveProviders(health.providers);
    }
  };

  useEffect(() => {
    if (scrollViewRef.current) {
      scrollViewRef.current.scrollToEnd({ animated: true });
    }
  }, [messages, loading]);

  const recognitionRef = useRef<any>(null);

  // Web Speech API Voice Input Handler
  const toggleVoiceRecording = () => {
    if (isRecording) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch (e) {}
        recognitionRef.current = null;
      }
      setIsRecording(false);
      clearInterval(timerRef.current);
      setRecordTime(0);
    } else {
      const windowObj = typeof window !== 'undefined' ? (window as any) : null;
      const SpeechRecognitionClass = windowObj?.SpeechRecognition || windowObj?.webkitSpeechRecognition;

      if (SpeechRecognitionClass) {
        try {
          const recognition = new SpeechRecognitionClass();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          recognition.onresult = (event: any) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              transcript += event.results[i][0].transcript;
            }
            if (transcript) {
              setInputPrompt(transcript.trim());
            }
          };

          recognition.onerror = (event: any) => {
            console.warn('[Speech Recognition Error]:', event.error);
            setIsRecording(false);
            clearInterval(timerRef.current);
          };

          recognition.onend = () => {
            setIsRecording(false);
            clearInterval(timerRef.current);
          };

          recognition.start();
          recognitionRef.current = recognition;
          setIsRecording(true);
          setRecordTime(0);
          timerRef.current = setInterval(() => {
            setRecordTime((prev) => prev + 1);
          }, 1000);
        } catch (err) {
          console.warn('[Speech Recognition Start Error]:', err);
          Alert.alert('Voice Recognition', 'Could not start voice recognition in this browser. Please type your query.');
        }
      }
    }
  };
  // Image Upload Handler (Camera / Gallery)
  const handlePickImageWeb = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload('image', file.name, file);
    }
  };

  // Document Upload Handler (PDF, DOCX, TXT)
  const handlePickDocumentWeb = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload('document', file.name, file);
    }
  };

  // Video Upload Handler (MP4, MOV)
  const handlePickVideoWeb = (e: any) => {
    const file = e.target.files?.[0];
    if (file) {
      simulateUpload('video', file.name, file);
    }
  };

  const simulateUpload = async (type: 'image' | 'document' | 'video', name: string, rawFile: any) => {
    setUploading(true);
    setUploadProgress(20);

    let base64: string | undefined = undefined;
    let extractedText: string | undefined = undefined;

    if (type === 'image' && rawFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        base64 = (event.target?.result as string).split(',')[1];
      };
      reader.readAsDataURL(rawFile);
    }

    const parsed = await aiBackendService.uploadAndParseFile(rawFile);
    extractedText = parsed.extractedText;

    setUploadProgress(70);
    setTimeout(() => {
      setUploadProgress(100);
      const newAtt: AttachmentItem = {
        id: 'att_' + Date.now(),
        name,
        type,
        url: type === 'image' && rawFile ? URL.createObjectURL(rawFile) : undefined,
        base64,
        extractedText,
      };
      setAttachments((prev) => [...prev, newAtt]);
      setUploading(false);
      setUploadProgress(0);
    }, 400);
  };

  const removeAttachment = (id: string) => {
    setAttachments(attachments.filter((a) => a.id !== id));
  };

  // Main Submit Handler
  const handleSendPrompt = async (overridePrompt?: string) => {
    const textToSend = overridePrompt || inputPrompt;
    if (!textToSend.trim() && attachments.length === 0) return;

    const userMessage: ChatMessageItem = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: textToSend,
      attachments: [...attachments],
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputPrompt('');
    const currentAttachments = [...attachments];
    setAttachments([]);
    setLoading(true);

    // Build context summary from attachments
    let attachmentsSummary = '';
    let imageBase64: string | undefined = undefined;

    currentAttachments.forEach((att) => {
      if (att.extractedText) {
        attachmentsSummary += `\n[File Attachment (${att.name})]: ${att.extractedText}`;
      }
      if (att.type === 'image' && att.base64) {
        imageBase64 = att.base64;
      }
    });

    const aiResponse = await aiBackendService.sendChatMessage(
      [...messages, userMessage],
      attachmentsSummary,
      imageBase64
    );

    setLoading(false);

    const aiMessage: ChatMessageItem = {
      id: 'ai_' + Date.now(),
      role: 'assistant',
      content: aiResponse.reply,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      providerUsed: aiResponse.provider_used,
    };

    setMessages((prev) => [...prev, aiMessage]);

    // 🔔 Fire AI notification for home-repair advice
    const repairKeywords = [
      'fix', 'repair', 'diagnose', 'replace', 'install', 'leak', 'circuit',
      'breaker', 'ac', 'air condition', 'plumb', 'wire', 'pipe', 'roof',
      'crack', 'damage', 'cost', 'estimate', 'professional', 'technician',
    ];
    const replyLower = aiResponse.reply.toLowerCase();
    const queryLower = textToSend.toLowerCase();
    const isRepairRelated = repairKeywords.some(
      (kw) => replyLower.includes(kw) || queryLower.includes(kw)
    );

    if (isRepairRelated) {
      // Pick a context hint from the user's original question
      const serviceHints: Record<string, string> = {
        leak: 'Plumber', plumb: 'Plumber', pipe: 'Plumber', water: 'Plumber',
        circuit: 'Electrician', breaker: 'Electrician', wire: 'Electrician', electric: 'Electrician', power: 'Electrician',
        ac: 'AC Service', 'air condition': 'AC Service', cool: 'AC Service',
        roof: 'Carpentry & Waterproofing', crack: 'Civil Repair',
        paint: 'Painting', carpenter: 'Carpentry',
      };
      let serviceLabel = 'Home Repair';
      for (const [keyword, label] of Object.entries(serviceHints)) {
        if (queryLower.includes(keyword) || replyLower.includes(keyword)) {
          serviceLabel = label;
          break;
        }
      }
      addNotification({
        type: 'ai',
        title: `AI Tip — ${serviceLabel} Advice`,
        message: `Can't fix it yourself? Book a certified ${serviceLabel} professional on FixNest for a safe, warranted repair.`,
      });
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* 1. Header with Active AI Gateway Status Badge & Back Option */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn} activeOpacity={0.75}>
              <ArrowLeft size={18} color={Colors.textPrimary} />
              <Text style={styles.backBtnText}>Back</Text>
            </TouchableOpacity>
          )}
          <View style={styles.headerTitleRow}>
            <View style={styles.aiBadgeGlow}>
              <Sparkles size={20} color={Colors.primary} />
            </View>
            <View>
              <Text style={styles.headerTitle}>FixNest AI Diagnostic</Text>
              <View style={styles.gatewayPill}>
                <Zap size={10} color={Colors.primary} />
                <Text style={styles.gatewayPillText}>
                  Gateway: {activeProviders.slice(0, 3).join(' • ')}
                </Text>
              </View>
            </View>
          </View>
        </View>
        <TouchableOpacity onPress={checkGatewayHealth} style={styles.refreshBtn}>
          <RefreshCw size={16} color={Colors.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Upload Progress Indicator */}
      {uploading && (
        <View style={styles.uploadProgressBanner}>
          <Text style={styles.uploadProgressText}>Uploading Attachment... {uploadProgress}%</Text>
          <View style={styles.progressBarBackground}>
            <View style={[styles.progressBarFill, { width: `${uploadProgress}%` }]} />
          </View>
        </View>
      )}

      {/* 2. Messages Stream */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatScroll}
        contentContainerStyle={styles.chatScrollContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <View key={msg.id} style={[styles.messageRow, isUser ? styles.messageRowUser : styles.messageRowAi]}>
              {!isUser && (
                <View style={styles.botAvatar}>
                  <Bot size={18} color={Colors.primary} />
                </View>
              )}

              <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAi]}>
                {msg.attachments && msg.attachments.length > 0 && (
                  <View style={styles.attachedPillsRow}>
                    {msg.attachments.map((att) => (
                      <View key={att.id} style={styles.attachedPill}>
                        {att.type === 'image' ? (
                          <ImageIcon size={12} color={Colors.primary} />
                        ) : att.type === 'video' ? (
                          <Video size={12} color={Colors.primary} />
                        ) : (
                          <FileText size={12} color={Colors.primary} />
                        )}
                        <Text style={styles.attachedPillName} numberOfLines={1}>{att.name}</Text>
                      </View>
                    ))}
                  </View>
                )}

                <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAi]}>
                  {msg.content}
                </Text>

                {msg.imageUrl && (
                  <TouchableOpacity style={styles.inlineImageWrapper} onPress={() => setZoomedImage(msg.imageUrl || null)}>
                    <Image source={{ uri: msg.imageUrl }} style={styles.inlineImage} />
                    <View style={styles.zoomIconBadge}>
                      <Maximize2 size={14} color="#FFFFFF" />
                    </View>
                  </TouchableOpacity>
                )}

                <View style={styles.messageFooterRow}>
                  <Text style={styles.messageTime}>{msg.timestamp}</Text>
                  {!isUser && msg.providerUsed && (
                    <View style={styles.providerBadge}>
                      <ShieldCheck size={10} color={Colors.primary} />
                      <Text style={styles.providerBadgeText}>{msg.providerUsed}</Text>
                    </View>
                  )}
                </View>
              </View>

              {isUser && (
                <View style={styles.userAvatar}>
                  <User size={16} color="#FFFFFF" />
                </View>
              )}
            </View>
          );
        })}

        {loading && (
          <View style={[styles.messageRow, styles.messageRowAi]}>
            <View style={styles.botAvatar}>
              <Bot size={18} color={Colors.primary} />
            </View>
            <View style={[styles.messageBubble, styles.bubbleAi, styles.loadingBubble]}>
              <ActivityIndicator size="small" color={Colors.primary} />
              <Text style={styles.loadingText}>Analyzing issue via FixNest AI Gateway...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* 3. Suggestions Row */}
      {messages.length < 3 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.suggestionsScroll}>
          {SUGGESTIONS.map((s) => (
            <TouchableOpacity key={s.id} style={styles.suggestionChip} onPress={() => handleSendPrompt(s.prompt)}>
              <Text style={styles.suggestionText}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* 4. Active Attachments Preview Bar */}
      {attachments.length > 0 && (
        <View style={styles.attachmentsPreviewBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {attachments.map((att) => (
              <View key={att.id} style={styles.attPreviewCard}>
                {att.url ? (
                  <Image source={{ uri: att.url }} style={styles.attPreviewThumb} />
                ) : (
                  <View style={styles.attPreviewIcon}>
                    {att.type === 'video' ? <Video size={16} color={Colors.primary} /> : <FileText size={16} color={Colors.primary} />}
                  </View>
                )}
                <Text style={styles.attPreviewName} numberOfLines={1}>{att.name}</Text>
                <TouchableOpacity style={styles.attRemoveBtn} onPress={() => removeAttachment(att.id)}>
                  <X size={12} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Recording Pulse Warning */}
      {isRecording && (
        <View style={styles.recordingAlertBanner}>
          <Mic size={16} color={Colors.error} />
          <Text style={styles.recordingAlertText}>Recording Voice Audio... ({recordTime}s)</Text>
          <TouchableOpacity style={styles.stopRecBtn} onPress={toggleVoiceRecording}>
            <Text style={styles.stopRecText}>Done</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 5. Multimodal Input Bar */}
      <View style={styles.inputContainer}>
        <View style={styles.mediaActionsRow}>
          {/* Photo Picker */}
          <TouchableOpacity style={styles.mediaBtn}>
            <Camera size={18} color={Colors.primary} />
            {Platform.OS === 'web' && (
              <input type="file" accept="image/*" onChange={handlePickImageWeb} style={styles.hiddenFileInput} />
            )}
          </TouchableOpacity>

          {/* Document Picker */}
          <TouchableOpacity style={styles.mediaBtn}>
            <FileText size={18} color={Colors.primary} />
            {Platform.OS === 'web' && (
              <input type="file" accept=".pdf,.docx,.txt" onChange={handlePickDocumentWeb} style={styles.hiddenFileInput} />
            )}
          </TouchableOpacity>

          {/* Video Picker */}
          <TouchableOpacity style={styles.mediaBtn}>
            <Video size={18} color={Colors.primary} />
            {Platform.OS === 'web' && (
              <input type="file" accept="video/*" onChange={handlePickVideoWeb} style={styles.hiddenFileInput} />
            )}
          </TouchableOpacity>

          {/* Voice Input */}
          <TouchableOpacity style={[styles.mediaBtn, isRecording && styles.mediaBtnActive]} onPress={toggleVoiceRecording}>
            <Mic size={18} color={isRecording ? Colors.error : Colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.inputRow}>
          <TextInput
            style={styles.textInput}
            value={inputPrompt}
            onChangeText={setInputPrompt}
            placeholder="Ask AI e.g. 'How do I fix a leaking P-trap?'"
            placeholderTextColor={Colors.textMuted}
            multiline
          />

          <TouchableOpacity
            style={[styles.sendBtn, (!inputPrompt.trim() && attachments.length === 0) && styles.sendBtnDisabled]}
            onPress={() => handleSendPrompt()}
            disabled={!inputPrompt.trim() && attachments.length === 0}
          >
            <Send size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Image Zoom Modal */}
      <Modal visible={!!zoomedImage} transparent animationType="fade">
        <TouchableOpacity style={styles.zoomModalOverlay} activeOpacity={1} onPress={() => setZoomedImage(null)}>
          <View style={styles.zoomModalContent}>
            {zoomedImage && <Image source={{ uri: zoomedImage }} style={styles.zoomedImg} resizeMode="contain" />}
            <TouchableOpacity style={styles.closeZoomBtn} onPress={() => setZoomedImage(null)}>
              <X size={20} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceCard,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    gap: 4,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  aiBadgeGlow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  gatewayPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  gatewayPillText: {
    fontSize: 10,
    color: Colors.primary,
    fontWeight: '700',
  },
  refreshBtn: {
    padding: 8,
  },
  uploadProgressBanner: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  uploadProgressText: {
    fontSize: 11,
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 4,
  },
  progressBarBackground: {
    height: 4,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  chatScroll: {
    flex: 1,
  },
  chatScrollContent: {
    padding: 16,
    paddingBottom: 24,
    gap: 16,
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 10,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAi: {
    justifyContent: 'flex-start',
  },
  botAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageBubble: {
    maxWidth: '82%',
    borderRadius: 18,
    padding: 14,
  },
  bubbleUser: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  bubbleAi: {
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    borderBottomLeftRadius: 4,
  },
  loadingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  textUser: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  textAi: {
    color: Colors.textPrimary,
  },
  attachedPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  attachedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  attachedPillName: {
    fontSize: 10,
    color: Colors.textPrimary,
  },
  inlineImageWrapper: {
    marginTop: 10,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  inlineImage: {
    width: '100%',
    height: 180,
    borderRadius: 12,
  },
  zoomIconBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 6,
    borderRadius: 8,
  },
  messageFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 8,
  },
  messageTime: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  providerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
  },
  providerBadgeText: {
    fontSize: 9,
    color: Colors.primary,
    fontWeight: '700',
  },
  suggestionsScroll: {
    paddingHorizontal: 16,
    marginVertical: 8,
    maxHeight: 38,
  },
  suggestionChip: {
    backgroundColor: Colors.surfaceElevated,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 14,
    marginRight: 8,
  },
  suggestionText: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  attachmentsPreviewBar: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  attPreviewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surfaceCard,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 6,
    borderRadius: 10,
    marginRight: 8,
  },
  attPreviewThumb: {
    width: 28,
    height: 28,
    borderRadius: 6,
  },
  attPreviewIcon: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  attPreviewName: {
    fontSize: 11,
    color: Colors.textPrimary,
    maxWidth: 100,
  },
  attRemoveBtn: {
    backgroundColor: Colors.error,
    borderRadius: 8,
    padding: 2,
  },
  recordingAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recordingAlertText: {
    color: Colors.error,
    fontSize: 12,
    fontWeight: '700',
  },
  stopRecBtn: {
    backgroundColor: Colors.error,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  stopRecText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  inputContainer: {
    paddingTop: 12,
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'ios' ? 95 : 85,
    backgroundColor: Colors.surfaceCard,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  mediaActionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  mediaBtn: {
    padding: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    position: 'relative',
  },
  mediaBtnActive: {
    borderColor: Colors.error,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  hiddenFileInput: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0,
    cursor: 'pointer',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  textInput: {
    flex: 1,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: Colors.textPrimary,
    fontSize: 14,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  zoomModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  zoomModalContent: {
    width: '90%',
    height: '80%',
    position: 'relative',
  },
  zoomedImg: {
    width: '100%',
    height: '100%',
  },
  closeZoomBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 8,
    borderRadius: 16,
  },
});
