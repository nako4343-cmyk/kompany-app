import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  QrCode,
  Copy,
  Check,
  Share2,
  Send,
  ShieldCheck,
  Users,
  MapPin,
  Star,
} from 'lucide-react';
import QRCode from 'qrcode';

interface DemoShareModalProps {
  onClose: () => void;
  sharedUrl?: string;
}

export const DemoShareModal: React.FC<DemoShareModalProps> = ({
  onClose,
  sharedUrl: propUrl,
}) => {
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  const shareUrl = propUrl || 'https://nako4343-cmyk.github.io/kompany-app/';

  useEffect(() => {
    QRCode.toDataURL(shareUrl, {
      width: 280,
      margin: 2,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
      errorCorrectionLevel: 'M',
    })
      .then(url => setQrDataUrl(url))
      .catch(err => console.error('Failed to generate QR code:', err));
  }, [shareUrl]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      console.warn('Copy failed', e);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Kompa — закрытый клуб городских встреч и компаний',
          text: 'Присоединяйся к Kompa: камерные ужины, настольные игры, концерты и спорт в проверенной компании.',
          url: shareUrl,
        });
      } catch {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(
    shareUrl
  )}&text=${encodeURIComponent(
    'Kompa — закрытый клуб городских встреч! Камерные ужины, настолки, концерты и дни рождения в проверенной компании.'
  )}`;

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
        className="w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border flex flex-col max-h-[92dvh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* iOS Sheet Grabber */}
        <div className="pt-2 pb-0.5 flex justify-center sm:hidden shrink-0">
          <div
            className="w-9 h-1 rounded-full opacity-20"
            style={{ backgroundColor: 'var(--text-primary)' }}
          />
        </div>

        {/* Header */}
        <div
          className="px-5 py-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              <QrCode className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2
                className="text-sm sm:text-base font-display font-bold leading-tight"
                style={{ color: 'var(--text-primary)' }}
              >
                Пригласить друзей в Kompa
              </h2>
              <span
                className="text-[11px] block"
                style={{ color: 'var(--text-secondary)' }}
              >
                Личное приглашение по QR-коду или прямой ссылке
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl border flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 pb-safe">
          {/* QR Pass Card */}
          <div
            className="p-5 rounded-3xl border text-center space-y-3.5 flex flex-col items-center justify-center studio-card"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider"
              style={{
                backgroundColor: 'var(--bg-surface)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent-text)',
              }}
            >
              <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Kompa Club Pass</span>
            </div>

            <div className="p-3.5 bg-white rounded-2xl shadow-sm border border-slate-200/80">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR-код приглашения Kompa"
                  className="w-44 h-44 sm:w-48 sm:h-48 object-contain"
                />
              ) : (
                <div className="w-44 h-44 sm:w-48 sm:h-48 flex items-center justify-center text-xs text-slate-400">
                  Генерация QR-кода...
                </div>
              )}
            </div>

            <p
              className="text-xs max-w-xs leading-relaxed"
              style={{ color: 'var(--text-secondary)' }}
            >
              Наведите камеру смартфона, чтобы мгновенно открыть клубную ленту встреч Kompa.
            </p>
          </div>

          {/* Direct Link & Copy */}
          <div className="space-y-1.5">
            <label
              className="text-[11px] font-bold uppercase tracking-wider block"
              style={{ color: 'var(--text-muted)' }}
            >
              Прямая ссылка на приложение
            </label>
            <div
              className="p-2 rounded-2xl border flex items-center justify-between gap-2"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
              }}
            >
              <span
                className="text-xs font-mono-num truncate px-2 select-all"
                style={{ color: 'var(--text-secondary)' }}
              >
                {shareUrl}
              </span>
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs"
                style={{
                  backgroundColor: copied ? '#10b981' : 'var(--accent-primary)',
                }}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Скопировано</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Копировать</span>
                  </>
                )}
              </motion.button>
            </div>
          </div>

          {/* Quick Share Actions */}
          <div className="grid grid-cols-2 gap-2.5">
            <a
              href={telegramShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="py-3 px-3.5 rounded-2xl text-xs font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-95 text-white"
              style={{ backgroundColor: '#229ED9' }}
            >
              <Send className="w-3.5 h-3.5" />
              <span>В Telegram</span>
            </a>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-3 px-3.5 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-elevated)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
            >
              <Share2
                className="w-3.5 h-3.5"
                style={{ color: 'var(--accent-primary)' }}
              />
              <span>Поделиться</span>
            </button>
          </div>

          {/* Club Highlights */}
          <div
            className="p-4 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <MapPin className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px] font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Приватный адрес
                </span>
              </div>
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <Users className="w-4 h-4 mx-auto mb-1" style={{ color: 'var(--accent-primary)' }} />
                <span className="text-[10px] font-bold block" style={{ color: 'var(--text-primary)' }}>
                  4–8 человек
                </span>
              </div>
              <div className="p-2 rounded-xl" style={{ backgroundColor: 'var(--bg-surface)' }}>
                <Star className="w-4 h-4 mx-auto mb-1 text-amber-500" />
                <span className="text-[10px] font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Индекс явки
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
