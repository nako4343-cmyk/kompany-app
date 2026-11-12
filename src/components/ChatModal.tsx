import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { X, Send, Shield, Users, AlertCircle, MessageSquarePlus } from 'lucide-react';
import { ChatMessage, EventItem, UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ChatModalProps {
  eventId: string;
  currentUser: UserProfile;
  onClose: () => void;
}

const QUICK_REPLIES: string[] = [
  'Привет!',
  'Сколько человек уже идет?',
  'Во сколько начало?',
  'Где именно встречаемся?',
  'Я уже в пути, скоро буду!',
  'Что нужно взять с собой?',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  eventId,
  currentUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const loadChat = async () => {
    try {
      const eventData = await api.getEvent(eventId);
      setEvent(eventData.event);
      const chatData = await api.getChatMessages(eventId);
      setMessages(chatData);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка загрузки чата');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessageText = async (rawText: string) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setErrorMsg('');

    try {
      const newMsg = await api.sendChatMessage(eventId, trimmed);
      setMessages(prev => [...prev, newMsg]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отправки');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');
    await sendMessageText(text);
  };

  const handleQuickReply = async (replyText: string) => {
    await sendMessageText(replyText);
    inputRef.current?.focus();
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs"
    >
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg h-[92vh] sm:h-[82vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 border-b flex items-center justify-between shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <h2 className="text-sm font-display font-bold line-clamp-1" style={{ color: 'var(--text-primary)' }}>
                {event?.title || 'Закрытый чат мероприятия'}
              </h2>
              <div className="flex items-center gap-1.5 text-[11px] text-emerald-500 font-semibold">
                <Shield className="w-3 h-3 shrink-0" />
                <span className="truncate">
                  {event
                    ? `Участников: ${event.occupiedSpots} из ${event.totalSpots} · Начало в ${event.time}`
                    : 'Закрытое пространство для одобренных участников'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer shrink-0"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Messages Body */}
        <div
          className="p-4 overflow-y-auto flex-1 space-y-3"
          style={{ backgroundColor: 'var(--bg-canvas)' }}
        >
          {errorMsg && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-500 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              Загружаем сообщения...
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === currentUser.id;

              if (msg.isSystemMessage) {
                return (
                  <div
                    key={msg.id}
                    className="p-2.5 my-2 rounded-xl border text-center text-xs"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    <p className="leading-relaxed">{msg.text}</p>
                    <span className="text-[10px] opacity-75 block mt-0.5 tabular-nums">{msg.timestamp}</span>
                  </div>
                );
              }

              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                    />
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs shadow-xs ${
                      isMine ? 'text-white rounded-br-xs' : 'border rounded-bl-xs'
                    }`}
                    style={
                      isMine
                        ? { backgroundColor: 'var(--accent-primary)' }
                        : {
                            backgroundColor: 'var(--bg-surface)',
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-primary)',
                          }
                    }
                  >
                    {!isMine && (
                      <span className="text-[10px] font-bold block mb-0.5" style={{ color: 'var(--accent-text)' }}>
                        {msg.senderName}
                      </span>
                    )}
                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    <span className={`text-[9px] block text-right mt-1 tabular-nums ${isMine ? 'text-white/75' : 'opacity-60'}`}>
                      {msg.timestamp}
                    </span>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Replies Bar */}
        <div
          className="px-3.5 pt-2.5 pb-2 border-t shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-1.5 mb-2">
            <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
            <span className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
              Быстрые ответы:
            </span>
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {QUICK_REPLIES.map(reply => (
              <motion.button
                key={reply}
                type="button"
                disabled={isSending}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickReply(reply)}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold border whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
              >
                {reply}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Input Footer */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 border-t flex items-center gap-2 shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={e => setInputText(e.target.value)}
            placeholder="Напишите сообщение участникам..."
            className="flex-1 p-3 rounded-xl border text-xs focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-xl disabled:opacity-40 text-white transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
