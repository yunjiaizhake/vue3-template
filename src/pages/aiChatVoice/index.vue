<template>
  <transition name="voice-modal">
    <div class="voice-modal">
      <div class="voice-modal-content">
        <div class="voice-modal-title">语音识别中</div>
        <div class="voice-modal-list">
          <p v-if="transcripts.length === 0 && !liveTranscript">等待语音输入…</p>
          <p v-if="transcribeError" class="error-text">{{ transcribeError }}</p>
          <p v-if="liveTranscript" class="live-text">{{ liveTranscript }}</p>
          <p v-for="(text, idx) in transcripts" :key="idx">{{ text }}</p>
        </div>
        <div class="voice-modal-actions">
          <button class="record-btn" @click="handleStop">结束识别</button>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
defineOptions({ name: 'music-ai-chat-voice' });

const emit = defineEmits(['close']);
const transcripts = ref<string[]>([]);
const liveTranscript = ref('');
const isRecording = ref(false);
const transcribeError = ref('');
const pendingFinals = ref<string[]>([]);
const SEND_DEBOUNCE_MS = 1600;

type SpeechRecognitionInstance = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  onresult: ((event: any) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
};

let recognition: SpeechRecognitionInstance | null = null;
let sendTimer: number | null = null;

function resetState() {
  transcripts.value = [];
  liveTranscript.value = '';
  pendingFinals.value = [];
  transcribeError.value = '';
}

async function startRecording() {
  if (isRecording.value) return;
  resetState();

  const SpeechRecognitionCtor =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  if (SpeechRecognitionCtor) {
    startSpeechRecognition(SpeechRecognitionCtor);
    return;
  }

  transcribeError.value = '当前浏览器不支持实时语音识别';
}

function stopRecording() {
  isRecording.value = false;
  if (recognition) {
    recognition.onresult = null;
    recognition.onend = null;
    recognition.onerror = null;
    recognition.stop();
    recognition = null;
  }

  flushPendingFinals(true);
}

function handleStop() {
  stopRecording();
  emit('close');
}

function startSpeechRecognition(SpeechRecognitionCtor: any) {
  recognition = new SpeechRecognitionCtor();
  const rec = recognition as SpeechRecognitionInstance;
  rec.lang = 'zh-CN';
  rec.continuous = true;
  rec.interimResults = true;

  rec.onresult = (event: any) => {
    let interim = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      const text = result[0]?.transcript || '';
      if (result.isFinal) {
        const finalText = text.trim();
        if (finalText) {
          pendingFinals.value.push(finalText);
        }
        liveTranscript.value = '';
      } else {
        interim += text;
      }
    }
    if (interim) {
      liveTranscript.value = interim.trim();
    }
    scheduleSend();
  };

  rec.onerror = (event: any) => {
    console.error('实时识别错误:', event);
    const error = event?.error || '';
    if (error === 'aborted') {
      return;
    }
    if (error === 'not-allowed' || error === 'service-not-allowed') {
      transcribeError.value = '麦克风权限被拒绝，请检查浏览器权限';
      return;
    }
    if (error === 'audio-capture') {
      transcribeError.value = '未检测到麦克风设备';
      return;
    }
    if (error === 'network') {
      transcribeError.value = '语音识别服务不可用或网络异常';
      return;
    }
    transcribeError.value = '实时识别失败，请检查麦克风权限';
  };

  rec.onend = () => {
    if (isRecording.value) {
      try {
        recognition?.start();
      } catch (_) { }
    }
  };

  rec.start();
  isRecording.value = true;
}

function scheduleSend() {
  if (sendTimer) {
    window.clearTimeout(sendTimer);
  }
  sendTimer = window.setTimeout(() => {
    flushPendingFinals(false);
  }, SEND_DEBOUNCE_MS);
}

function flushPendingFinals(forceIncludeLive: boolean) {
  if (sendTimer) {
    window.clearTimeout(sendTimer);
    sendTimer = null;
  }

  const parts = pendingFinals.value.slice();
  pendingFinals.value = [];

  if (forceIncludeLive && liveTranscript.value.trim()) {
    parts.push(liveTranscript.value.trim());
    liveTranscript.value = '';
  }

  const combined = parts.join(' ').trim();
  if (!combined) return;

  transcripts.value.push(combined);
  sendToChat(combined);
}

onMounted(() => {
  console.log("开始启动智能语音识别功能")
  startRecording();
});

onBeforeUnmount(() => {
  console.log("退出启动智能语音识别功能")
  stopRecording();
});

async function sendToChat(text: string) {
  const baseURL = import.meta.env.VITE_BASE_API_URL;
  try {
    const response = await fetch(`${baseURL}/gpt/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt: text,
      }),
    });

    if (!response.ok) {
      throw new Error(`请求失败：${response.status}`);
    }
  } finally {
    emit('close');
  }
}
</script>

<style lang="less" scoped>
.voice-modal {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

.voice-modal-enter-active,
.voice-modal-leave-active {
  transition: opacity 0.25s ease;
}

.voice-modal-enter-from,
.voice-modal-leave-to {
  opacity: 0;
}

.voice-modal-content {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.voice-modal-enter-from .voice-modal-content,
.voice-modal-leave-to .voice-modal-content {
  transform: scale(0.95);
  opacity: 0;
}

.voice-modal-content {
  width: 420px;
  max-height: 60vh;
  background: #1b1f2a;
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.voice-modal-title {
  font-size: 16px;
  font-weight: 600;
}

.voice-modal-list {
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
}

.voice-modal-actions {
  display: flex;
  justify-content: center;
}

.record-btn {
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  background: #38ef7d;
  color: #083b1a;
  font-size: 13px;
  cursor: pointer;
}

.error-text {
  color: #ff6b6b;
}
</style>
