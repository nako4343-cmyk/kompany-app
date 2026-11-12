import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Shield,
  Users,
  AlertCircle,
  MessageSquarePlus,
  Pin,
  PinOff,
  MapPin,
  Sparkles,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  PlusCircle,
} from 'lucide-react';
import { ChatMessage, EventItem, UserProfile } from '../types/index.ts';
import { api } from '../services/api.ts';

interface ChatModalProps {
  eventId: string;
  currentUser: UserProfile;
  onClose: () => void;
  lang?: 'ru' | 'en';
}

const QUICK_REPLIES_RU: string[] = [
  'Привет!',
  'Сколько человек уже идет?',
  'Во сколько начало?',
  'Где именно встречаемся?',
  'Я уже в пути, скоро буду!',
  'Что нужно взять с собой?',
];

const QUICK_REPLIES_EN: string[] = [
  'Hi everyone!',
  'How many people are coming?',
  'What time do we start?',
  'Where exactly do we meet?',
  'On my way, see you soon!',
  'Should I bring anything?',
];

export const ChatModal: React.FC<ChatModalProps> = ({
  eventId,
  currentUser,
  onClose,
  lang = 'ru',
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [event, setEvent] = useState<EventItem | null>(null);
  const [inputText, setInputText] = useState('');
  const [pinOnSend, setPinOnSend] = useState(false);
  const [pinLabelInput, setPinLabelInput] = useState('Адрес и место встречи');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Group chat creation / participants drawer state
  const [showGroupSetup, setShowGroupSetup] = useState(false);
  const [showParticipantsList, setShowParticipantsList] = useState(false);
  const [showAllPinned, setShowAllPinned] = useState(false);
  const [groupTitleInput, setGroupTitleInput] = useState('');
  const [autoPinAddress, setAutoPinAddress] = useState(true);
  const [welcomeNoteInput, setWelcomeNoteInput] = useState('');
  const [activePinnedIndex, setActivePinnedIndex] = useState(0);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const inputRef = useRef<HTMLInputElement>(null);

  const isEn = lang === 'en';
  const quickReplies = isEn ? QUICK_REPLIES_EN : QUICK_REPLIES_RU;

  const loadChat = async () => {
    try {
      const eventData = await api.getEvent(eventId);
      setEvent(eventData.event);
      setGroupTitleInput(
        eventData.event.groupChatTitle ||
          (isEn ? `Group Chat · ${eventData.event.title}` : `Групповой чат · ${eventData.event.title}`)
      );
      const chatData = await api.getChatMessages(eventId);
      setMessages(chatData);
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? 'Failed to load chat' : 'Ошибка загрузки чата'));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadChat();
  }, [eventId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const confirmedMembers = useMemo(() => {
    if (!event) return [];
    const list: Array<{
      id: string;
      name: string;
      age: number;
      avatarUrl: string;
      roleLabel: string;
      isOrganizer: boolean;
    }> = [
      {
        id: event.organizer.id,
        name: event.organizer.name,
        age: event.organizer.age,
        avatarUrl: event.organizer.avatarUrl,
        roleLabel: isEn ? 'Organizer' : 'Организатор',
        isOrganizer: true,
      },
    ];

    const seen = new Set<string>([event.organizer.id]);
    for (const p of event.approvedParticipants || []) {
      if (!seen.has(p.id)) {
        seen.add(p.id);
        list.push({
          id: p.id,
          name: p.name,
          age: p.age,
          avatarUrl: p.avatarUrl,
          roleLabel: p.occupation || (isEn ? 'Confirmed Guest' : 'Подтвержденный участник'),
          isOrganizer: false,
        });
      }
    }
    return list;
  }, [event, isEn]);

  const pinnedMessages = useMemo(
    () => messages.filter(m => m.isPinned),
    [messages]
  );

  const currentPinnedMessage = useMemo(() => {
    if (pinnedMessages.length === 0) return null;
    const safeIdx = activePinnedIndex % pinnedMessages.length;
    return pinnedMessages[safeIdx] || pinnedMessages[pinnedMessages.length - 1];
  }, [pinnedMessages, activePinnedIndex]);

  const scrollToMessage = (msgId: string) => {
    const el = messageRefs.current[msgId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  const sendMessageText = async (
    rawText: string,
    options?: { isPinned?: boolean; pinnedLabel?: string }
  ) => {
    const trimmed = rawText.trim();
    if (!trimmed || isSending) return;

    setIsSending(true);
    setErrorMsg('');

    try {
      const newMsg = await api.sendChatMessage(eventId, trimmed, options);
      setMessages(prev => [...prev, newMsg]);
      if (options?.isPinned) {
        setPinOnSend(false);
      }
    } catch (err: any) {
      setErrorMsg(err.message || (isEn ? 'Failed to send message' : 'Ошибка отправки'));
    } finally {
      setIsSending(false);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const text = inputText;
    const shouldPin = pinOnSend;
    const label = pinLabelInput;
    setInputText('');
    await sendMessageText(text, {
      isPinned: shouldPin,
      pinnedLabel: shouldPin ? label : undefined,
    });
  };

  const handleQuickReply = async (replyText: string) => {
    await sendMessageText(replyText);
    inputRef.current?.focus();
  };

  const handleTogglePin = async (messageId: string, label?: string) => {
    try {
      const updated = await api.togglePinChatMessage(eventId, messageId, label);
      setMessages(updated);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось изменить закрепление');
    }
  };

  const handlePinEventAddress = async () => {
    try {
      const updated = await api.pinEventAddressToChat(eventId);
      setMessages(updated);
      setActivePinnedIndex(updated.filter(m => m.isPinned).length - 1);
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось закрепить адрес');
    }
  };

  const handleCreateGroupChat = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.createGroupChat(eventId, {
        title: groupTitleInput,
        pinAddress: autoPinAddress,
        welcomeNote: welcomeNoteInput,
      });
      setEvent(res.event);
      setMessages(res.messages);
      setShowGroupSetup(false);
      setWelcomeNoteInput('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Не удалось создать групповой чат');
    }
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
        className="w-full max-w-xl h-[93vh] sm:h-[85vh] rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* 1. Top Header with Group Chat status & Confirmed Participants Avatars */}
        <div
          className="px-4 py-3.5 border-b flex items-center justify-between gap-2 shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0 border border-emerald-500/25">
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2
                  className="text-sm font-display font-bold line-clamp-1"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {event?.groupChatTitle || event?.title || (isEn ? 'Event Group Chat' : 'Групповой чат мероприятия')}
                </h2>
                {event?.groupChatInitialized && (
                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 text-[10px] font-bold shrink-0">
                    {isEn ? 'Group' : 'Групповой'}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 mt-0.5">
                {/* Overlapping avatars of confirmed participants */}
                <button
                  type="button"
                  onClick={() => {
                    setShowParticipantsList(prev => !prev);
                    setShowGroupSetup(false);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-500 hover:underline cursor-pointer"
                >
                  <div className="flex -space-x-1.5">
                    {confirmedMembers.slice(0, 5).map(member => (
                      <img
                        key={member.id}
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-4 h-4 rounded-full object-cover ring-1 ring-white dark:ring-slate-900"
                      />
                    ))}
                  </div>
                  <span className="truncate">
                    {isEn
                      ? `${confirmedMembers.length} confirmed members`
                      : `Подтверждено: ${confirmedMembers.length} участн.`}
                  </span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setShowGroupSetup(prev => !prev);
                setShowParticipantsList(false);
              }}
              className="px-2.5 py-1.5 rounded-xl text-[11px] font-bold border flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: showGroupSetup ? 'var(--accent-primary)' : 'var(--bg-elevated)',
                borderColor: showGroupSetup ? 'var(--accent-primary)' : 'var(--border-subtle)',
                color: showGroupSetup ? '#ffffff' : 'var(--text-primary)',
              }}
              title={isEn ? 'Create or configure group chat for confirmed participants' : 'Создать или настроить групповой чат подтвержденных участников'}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">
                {event?.groupChatInitialized
                  ? isEn
                    ? 'Group settings'
                    : 'Групповой чат'
                  : isEn
                  ? 'Create Group Chat'
                  : 'Создать групповой чат'}
              </span>
            </button>

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
        </div>

        {/* 2. Sticky Pinned Message Banner (Address / Important Announcements) */}
        {currentPinnedMessage ? (
          <div
            className="px-4 py-2.5 border-b flex items-start justify-between gap-3 shrink-0 transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              onClick={() => {
                scrollToMessage(currentPinnedMessage.id);
                if (pinnedMessages.length > 1) {
                  setActivePinnedIndex(prev => (prev + 1) % pinnedMessages.length);
                }
              }}
              className="flex items-start gap-2.5 min-w-0 flex-1 cursor-pointer group"
            >
              <div
                className="w-1 self-stretch rounded-full shrink-0 mt-0.5"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
              <Pin
                className="w-4 h-4 shrink-0 mt-0.5 rotate-12"
                style={{ color: 'var(--accent-primary)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span
                    className="text-[11px] font-bold"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    {currentPinnedMessage.pinnedLabel ||
                      (isEn ? 'Pinned Message' : 'Закрепленное сообщение')}
                  </span>
                  {pinnedMessages.length > 1 && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-bold tabular-nums"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {(activePinnedIndex % pinnedMessages.length) + 1}/{pinnedMessages.length}
                    </span>
                  )}
                  {currentPinnedMessage.pinnedBy && (
                    <span className="text-[10px] opacity-65">
                      · {currentPinnedMessage.pinnedBy}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs line-clamp-2 whitespace-pre-line mt-0.5 leading-snug"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {currentPinnedMessage.text}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 self-center">
              {event?.yandexMapsUrl && (
                <a
                  href={event.yandexMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="px-2.5 py-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/25 text-[10px] font-bold flex items-center gap-1 transition-colors"
                  title={isEn ? 'Open address in Yandex Maps' : 'Открыть адрес в Яндекс Картах'}
                >
                  <MapPin className="w-3 h-3" />
                  <span className="hidden sm:inline">{isEn ? 'Map' : 'Карта'}</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}

              {pinnedMessages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllPinned(prev => !prev)}
                  className="px-2 py-1 rounded-lg border text-[10px] font-bold cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {isEn ? `All (${pinnedMessages.length})` : `Все (${pinnedMessages.length})`}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTogglePin(currentPinnedMessage.id)}
                className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 transition-colors cursor-pointer"
                title={isEn ? 'Unpin message' : 'Открепить сообщение'}
              >
                <PinOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : (
          /* Quick Bar when nothing is pinned yet */
          <div
            className="px-4 py-2 border-b flex items-center justify-between gap-2 shrink-0"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="flex items-center gap-2 min-w-0 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <Pin className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="truncate">
                {isEn
                  ? 'Pin the exact meeting address or important details at the top'
                  : 'Закрепите точный адрес встречи или важные детали вверху чата'}
              </span>
            </div>
            <button
              type="button"
              onClick={handlePinEventAddress}
              className="px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-text)',
              }}
            >
              <MapPin className="w-3 h-3" />
              <span>{isEn ? 'Pin Address' : 'Закрепить адрес'}</span>
            </button>
          </div>
        )}

        {/* 3. Expandable Panel: Create / Configure Group Chat for Confirmed Participants */}
        <AnimatePresence>
          {showGroupSetup && (
            <motion.form
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              onSubmit={handleCreateGroupChat}
              className="border-b overflow-hidden shrink-0"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-500" />
                    <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                      {isEn
                        ? 'Group Chat for Confirmed Participants'
                        : 'Создание группового чата для подтвержденных участников'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowGroupSetup(false)}
                    className="text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    {isEn ? 'Close' : 'Свернуть'}
                  </button>
                </div>

                {/* Confirmed participants chips */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider block mb-1.5" style={{ color: 'var(--text-muted)' }}>
                    {isEn
                      ? `Confirmed Participants (${confirmedMembers.length})`
                      : `Участники группового чата (${confirmedMembers.length})`}
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {confirmedMembers.map(member => (
                      <div
                        key={member.id}
                        className="px-2.5 py-1 rounded-xl border flex items-center gap-1.5 text-[11px] font-medium"
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderColor: 'var(--border-subtle)',
                        }}
                      >
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-4 h-4 rounded-full object-cover"
                        />
                        <span>{member.name}</span>
                        <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Group Chat Title */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      {isEn ? 'Group Chat Name' : 'Название группового чата'}
                    </label>
                    <input
                      type="text"
                      value={groupTitleInput}
                      onChange={e => setGroupTitleInput(e.target.value)}
                      placeholder="Групповой чат мероприятия"
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider block mb-1" style={{ color: 'var(--text-muted)' }}>
                      {isEn ? 'Additional Pinned Note (optional)' : 'Важная заметка для закрепления (опц.)'}
                    </label>
                    <input
                      type="text"
                      value={welcomeNoteInput}
                      onChange={e => setWelcomeNoteInput(e.target.value)}
                      placeholder={isEn ? 'e.g. Table booked under Anna, floor 2' : 'Напр.: Столик на имя Анны, 2 этаж'}
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

                {/* Auto-pin exact address toggle */}
                <label
                  className="p-2.5 rounded-xl border flex items-start gap-2.5 cursor-pointer"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={autoPinAddress}
                    onChange={e => setAutoPinAddress(e.target.checked)}
                    className="mt-0.5 rounded accent-emerald-600"
                  />
                  <div className="text-xs leading-snug">
                    <span className="font-bold block" style={{ color: 'var(--text-primary)' }}>
                      {isEn
                        ? 'Pin exact meeting address & instructions at the top of chat'
                        : 'Закрепить точный адрес встречи и ориентиры в шапке чата'}
                    </span>
                    <span className="text-[11px] opacity-75 block mt-0.5">
                      📍 {event?.exactVenue || event?.approximateArea}
                      {event?.exactAddress ? ` · ${event.exactAddress}` : ''}
                    </span>
                  </div>
                </label>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowGroupSetup(false)}
                    className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    {isEn ? 'Cancel' : 'Отмена'}
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer shadow-xs"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Users className="w-3.5 h-3.5" />
                    <span>
                      {event?.groupChatInitialized
                        ? isEn
                          ? 'Update Group Chat & Pin Info'
                          : 'Обновить групповой чат и закреп'
                        : isEn
                        ? 'Create Group Chat for Participants'
                        : 'Создать групповой чат участников'}
                    </span>
                  </button>
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>

        {/* 4. Expandable Panel: Confirmed Participants List */}
        <AnimatePresence>
          {showParticipantsList && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden shrink-0"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                    {isEn
                      ? `Confirmed Group Chat Members (${confirmedMembers.length})`
                      : `Подтвержденные участники группового чата (${confirmedMembers.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowParticipantsList(false)}
                    className="text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    {isEn ? 'Hide' : 'Скрыть'}
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                  {confirmedMembers.map(member => (
                    <div
                      key={member.id}
                      className="p-2 rounded-xl border flex items-center justify-between gap-2"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <img
                          src={member.avatarUrl}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-7 h-7 rounded-full object-cover shrink-0"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                            {member.name}, {member.age}
                          </p>
                          <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>
                            {member.roleLabel}
                          </p>
                        </div>
                      </div>
                      {member.isOrganizer && (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold shrink-0">
                          {isEn ? 'Host' : 'Орг.'}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 5. Expandable Panel: All Pinned Messages List */}
        <AnimatePresence>
          {showAllPinned && pinnedMessages.length > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-b overflow-hidden shrink-0"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="p-3.5 space-y-2 max-h-48 overflow-y-auto">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                    <Pin className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                    {isEn ? `All Pinned Messages (${pinnedMessages.length})` : `Все закрепленные сообщения (${pinnedMessages.length})`}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowAllPinned(false)}
                    className="text-[11px] font-semibold opacity-70 hover:opacity-100 cursor-pointer"
                  >
                    {isEn ? 'Close' : 'Закрыть'}
                  </button>
                </div>
                {pinnedMessages.map(pm => (
                  <div
                    key={pm.id}
                    onClick={() => {
                      scrollToMessage(pm.id);
                      setShowAllPinned(false);
                    }}
                    className="p-2.5 rounded-xl border flex items-start justify-between gap-2 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <div className="min-w-0 flex-1">
                      <span className="text-[10px] font-bold block" style={{ color: 'var(--accent-text)' }}>
                        📌 {pm.pinnedLabel || 'Важное'} · {pm.senderName}
                      </span>
                      <p className="text-xs whitespace-pre-line line-clamp-2 mt-0.5" style={{ color: 'var(--text-primary)' }}>
                        {pm.text}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={e => {
                        e.stopPropagation();
                        handleTogglePin(pm.id);
                      }}
                      className="p-1.5 rounded-lg hover:bg-rose-500/10 text-rose-500 shrink-0 cursor-pointer"
                      title={isEn ? 'Unpin' : 'Открепить'}
                    >
                      <PinOff className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 6. Messages Body */}
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

          {/* Prompt to initialize group chat if not yet initialized */}
          {event && !event.groupChatInitialized && (
            <div
              className="p-3 rounded-2xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-start gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center shrink-0">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    {isEn
                      ? 'Assemble Group Chat for Confirmed Participants'
                      : 'Собрать групповой чат подтвержденных участников'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                    {isEn
                      ? `Unite all ${confirmedMembers.length} confirmed members and pin the exact meeting address`
                      : `Объедините всех подтвержденных участников (${confirmedMembers.length}) и закрепите точный адрес встречи`}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupSetup(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span>{isEn ? 'Set up' : 'Настроить'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div className="p-8 text-center text-xs" style={{ color: 'var(--text-muted)' }}>
              {isEn ? 'Loading messages...' : 'Загружаем сообщения...'}
            </div>
          ) : (
            messages.map(msg => {
              const isMine = msg.senderId === currentUser.id;

              if (msg.isSystemMessage) {
                return (
                  <div
                    key={msg.id}
                    ref={el => {
                      messageRefs.current[msg.id] = el;
                    }}
                    className="p-2.5 my-2 rounded-xl border text-center text-xs relative group"
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
                  ref={el => {
                    messageRefs.current[msg.id] = el;
                  }}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.16 }}
                  className={`flex items-end gap-2 group ${isMine ? 'justify-end' : 'justify-start'}`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mb-1"
                    />
                  )}

                  {/* Left Pin button for own messages */}
                  {isMine && (
                    <button
                      type="button"
                      onClick={() => handleTogglePin(msg.id)}
                      className={`p-1.5 rounded-lg border text-[10px] transition-opacity cursor-pointer mb-1 ${
                        msg.isPinned ? 'opacity-100 text-amber-500 border-amber-500/30 bg-amber-500/10' : 'opacity-60 sm:opacity-0 group-hover:opacity-100'
                      }`}
                      style={
                        msg.isPinned
                          ? undefined
                          : {
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-secondary)',
                            }
                      }
                      title={msg.isPinned ? (isEn ? 'Unpin message' : 'Открепить сообщение') : (isEn ? 'Pin important message' : 'Закрепить важное сообщение')}
                    >
                      {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  )}

                  <div
                    className={`max-w-[78%] rounded-2xl p-3 text-xs shadow-xs relative ${
                      isMine ? 'text-white rounded-br-xs' : 'border rounded-bl-xs'
                    } ${msg.isPinned ? 'ring-2 ring-amber-400/70' : ''}`}
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
                    {/* Pinned badge inside message bubble */}
                    {msg.isPinned && (
                      <div
                        className={`flex items-center gap-1 text-[10px] font-bold mb-1 pb-1 border-b ${
                          isMine ? 'text-amber-200 border-white/20' : 'text-amber-500 border-amber-500/20'
                        }`}
                      >
                        <Pin className="w-3 h-3 shrink-0 rotate-12" />
                        <span>{msg.pinnedLabel || (isEn ? 'Pinned' : 'Закреплено')}</span>
                      </div>
                    )}

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

                  {/* Right Pin button for other participants' messages */}
                  {!isMine && (
                    <button
                      type="button"
                      onClick={() => handleTogglePin(msg.id)}
                      className={`p-1.5 rounded-lg border text-[10px] transition-opacity cursor-pointer mb-1 ${
                        msg.isPinned ? 'opacity-100 text-amber-500 border-amber-500/30 bg-amber-500/10' : 'opacity-60 sm:opacity-0 group-hover:opacity-100'
                      }`}
                      style={
                        msg.isPinned
                          ? undefined
                          : {
                              backgroundColor: 'var(--bg-surface)',
                              borderColor: 'var(--border-subtle)',
                              color: 'var(--text-secondary)',
                            }
                      }
                      title={msg.isPinned ? (isEn ? 'Unpin message' : 'Открепить сообщение') : (isEn ? 'Pin important message' : 'Закрепить важное сообщение')}
                    >
                      {msg.isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 7. Quick Replies & Pin Tools Bar */}
        <div
          className="px-3.5 pt-2.5 pb-2 border-t shrink-0 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1.5">
              <MessageSquarePlus className="w-3.5 h-3.5 shrink-0" style={{ color: 'var(--accent-primary)' }} />
              <span className="text-[11px] font-bold" style={{ color: 'var(--text-secondary)' }}>
                {isEn ? 'Quick replies:' : 'Быстрые ответы:'}
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Toggle Pin for next outgoing message */}
              <button
                type="button"
                onClick={() => setPinOnSend(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors cursor-pointer ${
                  pinOnSend ? 'bg-amber-500/15 text-amber-500 border-amber-500/40' : ''
                }`}
                style={
                  pinOnSend
                    ? undefined
                    : {
                        backgroundColor: 'var(--bg-elevated)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-secondary)',
                      }
                }
              >
                <Pin className="w-3 h-3" />
                <span>
                  {pinOnSend
                    ? isEn
                      ? 'Will be pinned'
                      : 'Закрепить при отправке: ВКЛ'
                    : isEn
                    ? 'Pin next message'
                    : 'Закрепить сообщение'}
                </span>
              </button>

              {/* 1-click Pin Event Address button */}
              <button
                type="button"
                onClick={handlePinEventAddress}
                className="px-2.5 py-1 rounded-lg text-[10px] font-bold border flex items-center gap-1 transition-colors cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-primary)',
                }}
                title={isEn ? 'Send and pin exact venue address' : 'Отправить и закрепить точный адрес встречи'}
              >
                <MapPin className="w-3 h-3 text-red-500" />
                <span>{isEn ? 'Pin Address' : 'Закрепить адрес'}</span>
              </button>
            </div>
          </div>

          {pinOnSend && (
            <div className="flex items-center gap-2 pt-0.5">
              <span className="text-[10px] font-semibold" style={{ color: 'var(--text-muted)' }}>
                {isEn ? 'Pin tag:' : 'Метка закрепа:'}
              </span>
              {(['Адрес и место встречи', 'Важное сообщение', 'Время и сбор', 'Правила / Бронь'] as const).map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setPinLabelInput(tag)}
                  className={`px-2 py-0.5 rounded-md text-[10px] font-bold cursor-pointer border ${
                    pinLabelInput === tag ? 'bg-amber-500/15 text-amber-500 border-amber-500/40' : ''
                  }`}
                  style={
                    pinLabelInput === tag
                      ? undefined
                      : {
                          backgroundColor: 'var(--bg-elevated)',
                          borderColor: 'var(--border-subtle)',
                          color: 'var(--text-secondary)',
                        }
                  }
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            {quickReplies.map(reply => (
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

        {/* 8. Input Footer */}
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
            placeholder={
              pinOnSend
                ? isEn
                  ? 'Type an important message or address to pin...'
                  : 'Введите важное сообщение или адрес для закрепления...'
                : isEn
                ? 'Write a message to confirmed participants...'
                : 'Напишите сообщение участникам группового чата...'
            }
            className="flex-1 p-3 rounded-xl border text-xs focus:outline-none"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: pinOnSend ? '#f59e0b' : 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isSending}
            className="p-3 rounded-xl disabled:opacity-40 text-white transition-colors cursor-pointer flex items-center gap-1.5"
            style={{ backgroundColor: pinOnSend ? '#d97706' : 'var(--accent-primary)' }}
          >
            {pinOnSend && <Pin className="w-3.5 h-3.5" />}
            <Send className="w-4 h-4" />
          </button>
        </form>
      </motion.div>
    </div>
  );
};
