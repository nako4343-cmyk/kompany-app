import React, { useState, useEffect, useRef } from 'react';
import { X, Send, Shield, Users, AlertCircle } from 'lucide-react';
import { ChatMessage, EventItem, UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ChatModalProps {
  eventId: string;
  currentUser: UserProfile;
  onClose: () => void;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  eventId,
  currentUser,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    setInputText('');

    try {
      const newMsg = await api.sendChatMessage(eventId, text);
      setMessages(prev => [...prev, newMsg]);
    } catch (err: any) {
      setErrorMsg(err.message || 'Ошибка отправки');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs">
      <div
        className="w-full max-w-lg h-[92vh] sm:h-[80vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom duration-200"
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
                <span className="truncate">Закрытое пространство для одобренных участников</span>
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
                <div
                  key={msg.id}
                  className={`flex items-end gap-2 ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
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
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
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
            disabled={!inputText.trim()}
            className="p-3 rounded-xl disabled:opacity-40 text-white transition-colors cursor-pointer"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
