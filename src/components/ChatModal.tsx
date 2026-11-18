import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Users,
  AlertCircle,
  Pin,
  PinOff,
  MapPin,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  SlidersHorizontal,
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

const stripEmojis = (line: string): string =>
  line
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE0F}•]/gu, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

const cleanChatText = (raw: string): string =>
  (raw || '')
    .split('\n')
    .map(stripEmojis)
    .filter(Boolean)
    .join('\n');

const parseStructuredLines = (
  raw: string
): Array<{ label?: string; value: string }> => {
  const lines = (raw || '')
    .split('\n')
    .map(stripEmojis)
    .filter(Boolean);

  return lines.map(line => {
    const colonIdx = line.indexOf(':');
    if (colonIdx > 1 && colonIdx < 34) {
      return {
        label: line.slice(0, colonIdx).trim(),
        value: line.slice(colonIdx + 1).trim(),
      };
    }
    return { value: line };
  });
};

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
          (isEn
            ? `Group Chat · ${eventData.event.title}`
            : `Групповой чат · ${eventData.event.title}`)
      );
      const chatData = await api.getChatMessages(eventId);
      setMessages(chatData);
    } catch (err: any) {
      setErrorMsg(
        err.message || (isEn ? 'Failed to load chat' : 'Ошибка загрузки чата')
      );
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
          roleLabel:
            p.occupation ||
            (isEn ? 'Confirmed Guest' : 'Подтвержденный участник'),
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
      setErrorMsg(
        err.message || (isEn ? 'Failed to send message' : 'Ошибка отправки')
      );
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.98 }}
        transition={{ type: 'spring', damping: 30, stiffness: 360 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-xl h-[94dvh] sm:h-[86vh] rounded-t-[28px] sm:rounded-[28px] shadow-2xl border flex flex-col overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* iOS Sheet Grabber Handle (Mobile) */}
        <div className="pt-2 pb-0.5 flex justify-center sm:hidden shrink-0">
          <div
            className="w-9 h-1 rounded-full opacity-20"
            style={{ backgroundColor: 'var(--text-primary)' }}
          />
        </div>

        {/* 1. Top Header with Group Chat status & Confirmed Participants Avatars */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between gap-2.5 shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-primary)',
              }}
            >
              <Users className="w-5 h-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h2
                className="text-[15px] font-display font-bold truncate leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                {event?.groupChatTitle ||
                  event?.title ||
                  (isEn ? 'Event Group Chat' : 'Чат участников встречи')}
              </h2>

              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => {
                    setShowParticipantsList(prev => !prev);
                    setShowGroupSetup(false);
                  }}
                  className="flex items-center gap-1.5 text-[11px] font-semibold cursor-pointer hover:opacity-85 transition-opacity"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  <div className="flex -space-x-1.5">
                    {confirmedMembers.slice(0, 5).map(member => (
                      <img
                        key={member.id}
                        src={member.avatarUrl}
                        alt={member.name}
                        referrerPolicy="no-referrer"
                        className="w-4.5 h-4.5 rounded-full object-cover ring-1.5 ring-[var(--bg-surface)]"
                      />
                    ))}
                  </div>
                  <span className="truncate font-mono-num">
                    {isEn
                      ? `${confirmedMembers.length} confirmed`
                      : `${confirmedMembers.length} участн. в сборе`}
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
              className="h-9 px-3 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-colors cursor-pointer"
              style={{
                backgroundColor: showGroupSetup
                  ? 'var(--accent-primary)'
                  : 'var(--bg-elevated)',
                borderColor: showGroupSetup
                  ? 'var(--accent-primary)'
                  : 'var(--border-subtle)',
                color: showGroupSetup ? '#ffffff' : 'var(--text-primary)',
              }}
              title={
                isEn
                  ? 'Configure group chat & pinned info'
                  : 'Настроить групповой чат и закреп'
              }
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">
                {isEn ? 'Settings' : 'Настроить'}
              </span>
            </button>

            <button
              onClick={onClose}
              className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors cursor-pointer shrink-0 border"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title={isEn ? 'Close' : 'Закрыть'}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Sticky Pinned Message Banner (Address / Important Announcements) */}
        {currentPinnedMessage ? (
          <div
            className="px-4 py-2.5 border-b flex items-center justify-between gap-3 shrink-0 transition-colors"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div
              onClick={() => {
                scrollToMessage(currentPinnedMessage.id);
                if (pinnedMessages.length > 1) {
                  setActivePinnedIndex(
                    prev => (prev + 1) % pinnedMessages.length
                  );
                }
              }}
              className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer group"
            >
              <div
                className="w-0.5 h-7 rounded-full shrink-0"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              />
              <Pin
                className="w-3.5 h-3.5 shrink-0"
                style={{ color: 'var(--accent-primary)' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <span
                    className="text-[11px] font-bold tracking-tight truncate"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    {currentPinnedMessage.pinnedLabel ||
                      (isEn ? 'Pinned Details' : 'Закрепленная информация')}
                  </span>
                  {pinnedMessages.length > 1 && (
                    <span
                      className="px-1.5 py-0.2 rounded text-[10px] font-bold font-mono-num"
                      style={{
                        backgroundColor: 'var(--accent-soft)',
                        color: 'var(--accent-text)',
                      }}
                    >
                      {(activePinnedIndex % pinnedMessages.length) + 1}/
                      {pinnedMessages.length}
                    </span>
                  )}
                </div>
                <p
                  className="text-xs truncate mt-0.5 leading-snug font-medium"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {cleanChatText(currentPinnedMessage.text).replace(
                    /\n/g,
                    ' · '
                  )}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {event?.yandexMapsUrl && (
                <a
                  href={event.yandexMapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  className="h-7 px-2.5 rounded-lg bg-[#FC3F1D]/12 hover:bg-[#FC3F1D]/20 text-[#FC3F1D] border border-[#FC3F1D]/25 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  title={
                    isEn
                      ? 'Open address in Yandex Maps'
                      : 'Открыть в Яндекс Картах'
                  }
                >
                  <MapPin className="w-3 h-3" />
                  <span className="hidden xs:inline">
                    {isEn ? 'Map' : 'Карта'}
                  </span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              )}

              {pinnedMessages.length > 1 && (
                <button
                  type="button"
                  onClick={() => setShowAllPinned(prev => !prev)}
                  className="h-7 px-2.5 rounded-lg border text-[11px] font-semibold cursor-pointer font-mono-num"
                  style={{
                    backgroundColor: 'var(--bg-surface)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  {isEn
                    ? `All (${pinnedMessages.length})`
                    : `Все (${pinnedMessages.length})`}
                </button>
              )}

              <button
                type="button"
                onClick={() => handleTogglePin(currentPinnedMessage.id)}
                className="w-7 h-7 rounded-lg hover:bg-rose-500/10 text-rose-500 flex items-center justify-center transition-colors cursor-pointer"
                title={isEn ? 'Unpin message' : 'Открепить сообщение'}
              >
                <PinOff className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ) : null}

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
                    <Users
                      className="w-4 h-4"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                    <h3
                      className="text-xs font-bold"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isEn
                        ? 'Group Chat Settings'
                        : 'Параметры группового чата компании'}
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label
                      className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isEn ? 'Group Chat Name' : 'Название чата'}
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
                    <label
                      className="text-[10px] font-bold uppercase tracking-wider block mb-1"
                      style={{ color: 'var(--text-muted)' }}
                    >
                      {isEn
                        ? 'Additional Pinned Note'
                        : 'Дополнительный ориентир для гостей'}
                    </label>
                    <input
                      type="text"
                      value={welcomeNoteInput}
                      onChange={e => setWelcomeNoteInput(e.target.value)}
                      placeholder={
                        isEn
                          ? 'e.g. Table booked under Anna, floor 2'
                          : 'Напр.: Столик на имя Анны, 2 этаж'
                      }
                      className="w-full px-3 py-2 rounded-xl border text-xs focus:outline-none"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    />
                  </div>
                </div>

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
                    <span
                      className="font-bold block"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      {isEn
                        ? 'Pin exact meeting address & instructions at the top'
                        : 'Закрепить точный адрес встречи и ориентиры в шапке'}
                    </span>
                    <span
                      className="text-[11px] block mt-0.5"
                      style={{ color: 'var(--text-secondary)' }}
                    >
                      {event?.exactVenue || event?.approximateArea}
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
                    <span>
                      {isEn ? 'Save & Update Pin' : 'Сохранить и обновить'}
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
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {isEn
                      ? `Confirmed Members (${confirmedMembers.length})`
                      : `Состав подтверждённых участников (${confirmedMembers.length})`}
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
                          <p
                            className="text-xs font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {member.name}, {member.age}
                          </p>
                          <p
                            className="text-[10px] truncate"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            {member.roleLabel}
                          </p>
                        </div>
                      </div>
                      {member.isOrganizer ? (
                        <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-500 text-[10px] font-bold shrink-0">
                          {isEn ? 'Host' : 'Орг.'}
                        </span>
                      ) : (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
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
                  <span
                    className="text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <Pin
                      className="w-3.5 h-3.5"
                      style={{ color: 'var(--accent-primary)' }}
                    />
                    {isEn
                      ? `All Pinned Messages (${pinnedMessages.length})`
                      : `Все закрепленные сообщения (${pinnedMessages.length})`}
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
                      <span
                        className="text-[10px] font-bold uppercase tracking-wider block"
                        style={{ color: 'var(--accent-text)' }}
                      >
                        {pm.pinnedLabel || 'Важное'} · {pm.senderName}
                      </span>
                      <p
                        className="text-xs line-clamp-2 mt-0.5 leading-relaxed"
                        style={{ color: 'var(--text-primary)' }}
                      >
                        {cleanChatText(pm.text).replace(/\n/g, ' · ')}
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
              className="p-3 rounded-2xl border flex items-center justify-between gap-3 studio-card"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    backgroundColor: 'var(--accent-soft)',
                    color: 'var(--accent-primary)',
                  }}
                >
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p
                    className="text-xs font-bold truncate"
                    style={{ color: 'var(--text-primary)' }}
                  >
                    {isEn
                      ? 'Pin meeting address for everyone'
                      : 'Закрепить карточку с адресом для гостей'}
                  </p>
                  <p
                    className="text-[11px] truncate"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {event.exactVenue || event.approximateArea}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowGroupSetup(true)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold text-white flex items-center gap-1 shrink-0 cursor-pointer"
                style={{ backgroundColor: 'var(--accent-primary)' }}
              >
                <span>{isEn ? 'Pin' : 'Закрепить'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {isLoading ? (
            <div
              className="p-8 text-center text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              {isEn ? 'Loading messages...' : 'Загружаем переписку...'}
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
                    className="px-4 py-2 my-1.5 rounded-2xl border text-center text-[11px] max-w-md mx-auto"
                    style={{
                      backgroundColor: 'var(--bg-elevated)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                  >
                    <p className="leading-relaxed font-medium">
                      {cleanChatText(msg.text)}
                    </p>
                  </div>
                );
              }

              const structuredRows = parseStructuredLines(msg.text);
              const isStructuredCard =
                structuredRows.length >= 2 &&
                structuredRows.filter(r => Boolean(r.label)).length >= 2;

              // Editorial Venue Pass Card for structured address / pinned logistics
              if (isStructuredCard) {
                return (
                  <motion.div
                    key={msg.id}
                    ref={el => {
                      messageRefs.current[msg.id] = el;
                    }}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.16 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="w-full max-w-[92%] sm:max-w-[82%] rounded-[22px] border p-4 studio-card space-y-2.5"
                      style={{
                        backgroundColor: 'var(--bg-surface)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      <div
                        className="flex items-center justify-between gap-2 pb-2 border-b"
                        style={{ borderColor: 'var(--border-subtle)' }}
                      >
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span
                            className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0"
                            style={{
                              backgroundColor: 'var(--accent-soft)',
                              color: 'var(--accent-primary)',
                            }}
                          >
                            <MapPin className="w-3.5 h-3.5" />
                          </span>
                          <span
                            className="text-xs font-display font-bold truncate"
                            style={{ color: 'var(--text-primary)' }}
                          >
                            {msg.pinnedLabel ||
                              (isEn
                                ? 'Meeting Point & Details'
                                : 'Карточка места встречи')}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="text-[10px] font-mono-num"
                            style={{ color: 'var(--text-muted)' }}
                          >
                            {msg.timestamp}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleTogglePin(msg.id)}
                            className="p-1 rounded-md hover:opacity-100 opacity-70 transition-opacity cursor-pointer"
                            style={{ color: 'var(--text-muted)' }}
                            title={
                              msg.isPinned
                                ? isEn
                                  ? 'Unpin'
                                  : 'Открепить'
                                : isEn
                                ? 'Pin'
                                : 'Закрепить'
                            }
                          >
                            {msg.isPinned ? (
                              <PinOff className="w-3.5 h-3.5 text-rose-500" />
                            ) : (
                              <Pin className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-2 text-[13px] leading-snug">
                        {structuredRows.map((row, idx) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-xl border"
                            style={{
                              backgroundColor: 'var(--bg-elevated)',
                              borderColor: 'var(--border-subtle)',
                            }}
                          >
                            {row.label && (
                              <span
                                className="text-[10px] font-bold uppercase tracking-wider block mb-0.5"
                                style={{ color: 'var(--text-muted)' }}
                              >
                                {row.label}
                              </span>
                            )}
                            <span
                              className="font-semibold block"
                              style={{ color: 'var(--text-primary)' }}
                            >
                              {row.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
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
                  className={`flex items-end gap-2 group ${
                    isMine ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isMine && (
                    <img
                      src={msg.senderAvatar}
                      alt={msg.senderName}
                      referrerPolicy="no-referrer"
                      className="w-7 h-7 rounded-full object-cover shrink-0 mb-0.5"
                    />
                  )}

                  <div
                    className={`max-w-[82%] sm:max-w-[74%] px-3.5 py-2.5 relative transition-all ${
                      isMine
                        ? 'text-white rounded-[20px] rounded-br-[6px]'
                        : 'border rounded-[20px] rounded-bl-[6px] studio-card'
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
                    {(!isMine || msg.isPinned) && (
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span
                          className="text-[11px] font-bold tracking-tight truncate"
                          style={{
                            color: isMine
                              ? 'rgba(255,255,255,0.92)'
                              : 'var(--accent-text)',
                          }}
                        >
                          {msg.isPinned
                            ? msg.pinnedLabel || msg.senderName
                            : msg.senderName}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer"
                          style={{
                            color: isMine ? '#FFFFFF' : 'var(--text-muted)',
                          }}
                        >
                          {msg.isPinned ? (
                            <PinOff className="w-3 h-3" />
                          ) : (
                            <Pin className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    )}

                    <p className="text-[14px] leading-[1.42] tracking-[-0.01em] whitespace-pre-wrap">
                      {cleanChatText(msg.text)}
                    </p>

                    <div className="flex items-center justify-end gap-1.5 mt-1">
                      {isMine && !msg.isPinned && (
                        <button
                          type="button"
                          onClick={() => handleTogglePin(msg.id)}
                          className="opacity-50 hover:opacity-100 transition-opacity cursor-pointer text-white/80"
                          title={isEn ? 'Pin message' : 'Закрепить сообщение'}
                        >
                          <Pin className="w-2.5 h-2.5" />
                        </button>
                      )}
                      <span
                        className={`text-[10px] font-medium font-mono-num ${
                          isMine ? 'text-white/75' : 'opacity-55'
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* 7. Sleek iOS Single-Row Quick Actions + Composer Dock */}
        <div
          className="px-3.5 pt-2 pb-3 pb-safe border-t shrink-0 space-y-2"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* Optional Pin Label Selector when Pin-on-send is toggled on */}
          <AnimatePresence initial={false}>
            {pinOnSend && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <span
                    className="text-[10px] font-bold uppercase tracking-wider shrink-0"
                    style={{ color: 'var(--accent-text)' }}
                  >
                    {isEn ? 'Pin tag:' : 'Рубрика закрепа:'}
                  </span>
                  {(
                    [
                      'Адрес и место встречи',
                      'Важное сообщение',
                      'Время и сбор',
                      'Правила / Бронь',
                    ] as const
                  ).map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setPinLabelInput(tag)}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-semibold cursor-pointer border whitespace-nowrap shrink-0 transition-colors"
                      style={
                        pinLabelInput === tag
                          ? {
                              backgroundColor: 'var(--accent-soft)',
                              borderColor: 'var(--accent-primary)',
                              color: 'var(--accent-text)',
                            }
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
              </motion.div>
            )}
          </AnimatePresence>

          {/* Single-line Horizontal Quick Replies + 1-Click Address Pin */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={handlePinEventAddress}
              className="h-7 px-2.5 rounded-xl text-[11px] font-bold border flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
              style={{
                backgroundColor: 'var(--accent-soft)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-text)',
              }}
              title={
                isEn
                  ? 'Send and pin exact venue address'
                  : 'Отправить и закрепить точный адрес встречи'
              }
            >
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{isEn ? 'Pin Address' : 'Адрес в закреп'}</span>
            </button>

            {quickReplies.map(reply => (
              <motion.button
                key={reply}
                type="button"
                disabled={isSending}
                whileTap={{ scale: 0.96 }}
                onClick={() => handleQuickReply(reply)}
                className="h-7 px-3 rounded-xl text-[11px] font-semibold border whitespace-nowrap shrink-0 transition-colors cursor-pointer disabled:opacity-50"
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

          {/* Unified iOS Composer Bar */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-center gap-2"
          >
            <div
              className="flex-1 flex items-center gap-1.5 pl-2 pr-3 py-1.5 rounded-2xl border transition-colors"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: pinOnSend
                  ? 'var(--accent-primary)'
                  : 'var(--border-subtle)',
              }}
            >
              <button
                type="button"
                onClick={() => setPinOnSend(prev => !prev)}
                title={
                  isEn
                    ? 'Pin this message when sent'
                    : 'Закрепить сообщение при отправке'
                }
                className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-colors cursor-pointer"
                style={{
                  backgroundColor: pinOnSend
                    ? 'var(--accent-primary)'
                    : 'transparent',
                  color: pinOnSend ? '#FFFFFF' : 'var(--text-muted)',
                }}
              >
                <Pin className="w-4 h-4" />
              </button>

              <input
                ref={inputRef}
                type="text"
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                placeholder={
                  pinOnSend
                    ? isEn
                      ? 'Important note or address to pin...'
                      : 'Важное сообщение для закрепления...'
                    : isEn
                    ? 'Message participants...'
                    : 'Сообщение участникам встречи...'
                }
                className="flex-1 bg-transparent text-[15px] sm:text-sm focus:outline-none min-w-0 py-1"
                style={{ color: 'var(--text-primary)' }}
              />
            </div>

            <motion.button
              whileTap={{ scale: 0.92 }}
              type="submit"
              disabled={!inputText.trim() || isSending}
              className="w-11 h-11 rounded-2xl disabled:opacity-40 text-white transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
              style={{ backgroundColor: 'var(--accent-primary)' }}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
};
