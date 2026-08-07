import { Platform } from 'react-native';

const BACKEND_URL =
  Platform.OS === 'web'
    ? 'http://localhost:8000'
    : 'http://10.0.2.2:8000'; // Standard Android emulator localhost mapping

export interface ChatMessageItem {
  id?: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: string;
  attachments?: AttachmentItem[];
  imageUrl?: string;
  providerUsed?: string;
}

export interface AttachmentItem {
  id: string;
  name: string;
  type: 'image' | 'document' | 'video' | 'audio';
  url?: string;
  base64?: string;
  extractedText?: string;
}

export interface AIChatResponse {
  success: boolean;
  reply: string;
  provider_used: string;
  elapsed_seconds?: number;
  provider_notices?: string[];
}

export const aiBackendService = {
  /**
   * Check backend health and active AI providers
   */
  async checkHealth(): Promise<{ online: boolean; providers: string[] }> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (response.ok) {
        const data = await response.json();
        const activeList = data.providers
          .filter((p: any) => p.configured)
          .map((p: any) => p.name);
        return { online: true, providers: activeList };
      }
    } catch (e) {
      console.warn('[AI Backend Service] Health check notice (Backend offline, fallback active):', e);
    }
    return { online: false, providers: ['FixNest Diagnostic Engine'] };
  },

  /**
   * Send multimodal chat prompt through FastAPI AI Gateway
   */
  async sendChatMessage(
    messages: ChatMessageItem[],
    attachmentsSummary?: string,
    imageBase64?: string
  ): Promise<AIChatResponse> {
    const formattedMessages = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: formattedMessages,
          attachments_summary: attachmentsSummary || null,
          image_base64: imageBase64 || null,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          reply: data.reply,
          provider_used: data.provider_used,
          elapsed_seconds: data.elapsed_seconds,
          provider_notices: data.provider_notices,
        };
      }
    } catch (err) {
      console.warn('[AI Backend Service] Backend call notice, executing local fallback:', err);
    }

    // Local Expert Fallback Response if backend is offline
    const lastUserMsg = messages[messages.length - 1]?.content || '';
    return {
      success: true,
      reply: this.generateLocalFallback(lastUserMsg),
      provider_used: 'FixNest Expert Diagnostic Engine (Offline Mode)',
      elapsed_seconds: 0.1,
    };
  },

  /**
   * Request technical image generation for diagrams / repair illustrations
   */
  async generateImage(prompt: string): Promise<{ success: boolean; imageUrl: string; description: string }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/ai/generate-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          imageUrl: data.imageUrl,
          description: data.description || prompt,
        };
      }
    } catch (err) {
      console.warn('[AI Backend Service] Image generation notice, fallback active:', err);
    }

    const cleanPrompt = encodeURIComponent(prompt.replace(/generate|draw|create/gi, '').trim() || 'home_repair_diagram');
    return {
      success: true,
      imageUrl: `https://image.pollinations.ai/prompt/fixnest%20home%20repair%20diagram%20${cleanPrompt}?width=800&height=600&seed=42&nologo=true`,
      description: `Generated technical illustration for: ${prompt}`,
    };
  },

  /**
   * Upload file to backend for document/video text extraction
   */
  async uploadAndParseFile(file: File | { uri: string; name: string; type: string }): Promise<{ filename: string; extractedText: string }> {
    try {
      const formData = new FormData();
      if (Platform.OS === 'web' && file instanceof File) {
        formData.append('file', file);
      } else {
        formData.append('file', {
          uri: (file as any).uri,
          name: (file as any).name || 'attachment.file',
          type: (file as any).type || 'application/octet-stream',
        } as any);
      }

      const response = await fetch(`${BACKEND_URL}/api/ai/upload-parse`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        return {
          filename: data.filename,
          extractedText: data.extracted_text,
        };
      }
    } catch (err) {
      console.warn('[AI Backend Service] Upload parse notice:', err);
    }

    return {
      filename: (file as any).name || 'Uploaded File',
      extractedText: `[Attachment Loaded]: ${(file as any).name || 'File'}. Ready for diagnostic review.`,
    };
  },

  /**
   * Fallback rule engine when backend is starting or offline
   */
  generateLocalFallback(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('leak') || p.includes('water') || p.includes('pipe') || p.includes('sink')) {
      return `### 🛠️ FixNest Plumbing Diagnostic Analysis

**Primary Assessment:**
Based on your inquiry, this appears to be a **P-trap or seal leak** under your fixture.

**Recommended Safety Steps:**
1. **Shut off the local isolation valve** located directly behind or beneath the fixture clockwise.
2. Place a small basin underneath to collect water.
3. Inspect slip-joint nuts for loose seals or worn washers.

**Estimated Professional Cost Range:**
- **DIY Repair:** $5 - $15 (New washer or Teflon tape)
- **Professional Plumber:** $65 - $140 (Standard 1-hour service call)

*Tap "Book Service" below to schedule a verified FixNest plumber immediately.*`;
    }

    if (p.includes('breaker') || p.includes('spark') || p.includes('electric') || p.includes('power')) {
      return `### ⚡ FixNest Electrical Safety Diagnostic

**Primary Assessment:**
Circuit trip or localized over-current condition detected.

**🚨 Safety Warning:**
Never touch exposed copper wiring or reset a hot breaker repeatedly.

**Diagnostic Steps:**
1. Unplug heavy appliances on the affected circuit branch.
2. Locate your main Breaker Panel. Find the switch in the "TRIPPED" (center) position.
3. Push firmly to **OFF**, then back to **ON**.

**Estimated Professional Cost Range:**
- **Professional Electrician:** $75 - $160 (Circuit audit & breaker replacement)`;
    }

    return `### 🏠 FixNest AI Diagnostic Assistant

Thank you for your home maintenance inquiry.

**Diagnostic Recommendations:**
1. Inspect the affected appliance or fixture for visible leaks, loose fittings, or power trip indicators.
2. You can attach a diagnostic photograph (📷), home manual (📄), or voice note (🎙️) for multi-angle AI inspection.

**Estimated Cost Range:**
- **Standard Inspection & Repair:** $50 - $150 depending on required replacement parts.`;
  },
};
