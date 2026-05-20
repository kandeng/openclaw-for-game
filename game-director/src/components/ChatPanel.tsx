import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Camera, Users, Gamepad2, Settings, Radio } from 'lucide-react';
import { useStore } from '../state/store';
import { sendChat } from '../matrix/dispatcher';

interface ChatPanelProps {
  toolboxOpen: boolean;
  onToggleToolbox: () => void;
  onDragDelta?: (deltaVh: number) => void;
}

function avatarLabel(userId: string): string {
  // "@alice:matrix.openclaw.local" -> "A"
  const m = /^@([^:]+)/.exec(userId);
  return m ? m[1].charAt(0).toUpperCase() : '?';
}

export default function ChatPanel({ toolboxOpen, onToggleToolbox, onDragDelta }: ChatPanelProps) {
  const creds = useStore((s) => s.creds);
  const client = useStore((s) => s.client);
  const log = useStore((s) => s.log);
  const selectedRoomId = useStore((s) => s.selectedRoomId);

  const messages = selectedRoomId ? log.filter((m) => m.roomId === selectedRoomId) : [];

  const [input, setInput] = useState('');
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const isDragging = useRef(false);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleDragStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
    dragStartY.current = e.touches[0].clientY;
  }, []);

  const handleDragMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !onDragDelta) return;
    const deltaY = dragStartY.current - e.touches[0].clientY;
    const deltaVh = (deltaY / window.innerHeight) * 100;
    onDragDelta(deltaVh);
    dragStartY.current = e.touches[0].clientY;
  }, [onDragDelta]);

  const handleDragEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleSend = useCallback(async () => {
    if (!client || !selectedRoomId || !input.trim() || busy) return;
    setBusy(true);
    setSendErr(null);
    try {
      await sendChat(client, selectedRoomId, input.trim());
      setInput('');
    } catch (e) {
      setSendErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }, [client, selectedRoomId, input, busy]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const toolboxItems = [
    { icon: Camera, label: '拍照' },
    { icon: Users, label: '识别' },
    { icon: Gamepad2, label: '游戏' },
    { icon: Settings, label: '设置' },
  ];

  return (
    <div
      className="flex flex-col h-full overflow-hidden bg-white/70 backdrop-blur-xl border-t border-gray-200"
      style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 20px)' }}
    >
      {/* Drag handle */}
      <div
        className="flex justify-center items-center cursor-grab active:cursor-grabbing touch-none"
        style={{ height: '44px', flexShrink: 0 }}
        onTouchStart={handleDragStart}
        onTouchMove={handleDragMove}
        onTouchEnd={handleDragEnd}
      >
        <div className="w-12 h-1.5 rounded-full bg-gray-300" />
      </div>

      {/* Top spacer */}
      <div style={{ height: '24px', flexShrink: 0 }} />

      <motion.div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden px-4 space-y-2"
        layout
        transition={{ duration: 0.3 }}
      >
        {messages.length === 0 && (
          <div className="text-center text-xs text-gray-400 py-8">
            {!selectedRoomId
              ? 'Setting up chat...'
              : 'No messages yet. Say something below.'}
          </div>
        )}
        {messages.map((msg) => {
          const isMe = creds && msg.sender === creds.userId;
          return (
            <div
              key={msg.eventId}
              className={`flex items-start gap-2 w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
            >
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0">
                <span className="text-xs font-medium text-gray-600">
                  {isMe ? '我' : avatarLabel(msg.sender)}
                </span>
              </div>
              <div
                className={`max-w-[calc(100%-48px)] px-3 py-2 rounded-xl text-sm break-words ${
                  isMe ? 'bg-blue-100 text-gray-900' : 'bg-gray-100 text-gray-800'
                }`}
              >
                {msg.body}
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Bottom spacer */}
      <div style={{ height: '12px', flexShrink: 0 }} />

      {sendErr && (
        <div className="px-4 pb-2 text-xs text-red-500 truncate">Send failed: {sendErr}</div>
      )}

      {/* Input bar */}
      <div className="flex items-center gap-2 px-3 py-2 border-t border-gray-100">
        <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
          <Radio size={16} className="text-gray-500" />
        </div>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={selectedRoomId ? '输入文字，拍照，或者说话' : 'Setting up chat...'}
          disabled={!selectedRoomId || busy}
          className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm outline-none placeholder-gray-400 disabled:opacity-50"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || busy || !selectedRoomId}
          className="px-3 h-8 rounded-full bg-blue-500 text-white text-xs font-medium disabled:opacity-40 active:bg-blue-600"
        >
          {busy ? '…' : 'Send'}
        </button>
        <button
          onClick={onToggleToolbox}
          className={`w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center transition-transform ${
            toolboxOpen ? 'rotate-45' : ''
          }`}
        >
          <Plus size={18} className="text-gray-600" />
        </button>
      </div>

      {/* Toolbox */}
      <AnimatePresence>
        {toolboxOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden border-t border-gray-100"
          >
            <div className="grid grid-cols-4 gap-3 px-4 py-3">
              {toolboxItems.map((item, i) => (
                <button
                  key={i}
                  className="flex flex-col items-center gap-1 p-3 rounded-xl border border-gray-200 bg-white/50 active:bg-gray-100 transition-colors"
                >
                  <item.icon size={24} className="text-gray-600" />
                  <span className="text-xs text-gray-500">{item.label}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
