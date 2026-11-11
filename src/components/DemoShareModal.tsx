import React, { useState, useEffect } from 'react';
import { 
  X, QrCode, Copy, Check, Share2, Send, 
  Smartphone, ShieldCheck, Sparkles, ExternalLink, Download, 
  Globe, AlertCircle, HelpCircle, Layers
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
  const [activeTab, setActiveTab] = useState<'qr' | 'deploy'>('qr');
  const [copied, setCopied] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Default shared URL pointing to the live GitHub Pages site
  const demoUrl = propUrl || 'https://nako4343-cmyk.github.io/kompany-app/';

  useEffect(() => {
    QRCode.toDataURL(demoUrl, {
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
  }, [demoUrl]);

  const handleCopy = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(demoUrl);
      } else {
        const input = document.createElement('input');
        input.value = demoUrl;
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
          title: 'Kompany — Демо-версия сервиса',
          text: 'Зацени сервис для поиска компании на выходные и праздники с безопасным скрытием адреса и точных контактов!',
          url: demoUrl,
        });
      } catch (err) {
        // user cancelled
      }
    } else {
      handleCopy();
    }
  };

  const telegramShareUrl = `https://t.me/share/url?url=${encodeURIComponent(demoUrl)}&text=${encodeURIComponent(
    'Зацени демо Kompany — сервис для поиска компании на события с безопасным скрытием адреса и отзывов о встречах!'
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-xs animate-in fade-in duration-150">
      <div
        className="w-full max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="p-4 sm:p-5 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-2xl flex items-center justify-center shrink-0"
              style={{
                backgroundColor: 'var(--accent-soft)',
                color: 'var(--accent-primary)',
              }}
            >
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-display font-bold leading-tight" style={{ color: 'var(--text-primary)' }}>
                Демо сайт для друзей
              </h2>
              <span className="text-[11px] block" style={{ color: 'var(--text-secondary)' }}>
                Доступ по ссылке, QR-коду и развертывание на внешнем хостинге
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-colors cursor-pointer"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              color: 'var(--text-secondary)',
            }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Mode Switcher */}
        <div className="p-3 pb-0 px-5 sm:px-6 shrink-0">
          <div
            className="flex items-center p-1 rounded-2xl border text-xs font-bold"
            style={{
              backgroundColor: 'var(--bg-elevated)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('qr')}
              className="flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'qr' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'qr' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'qr' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <QrCode className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Ссылка и QR-код</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('deploy')}
              className="flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              style={{
                backgroundColor: activeTab === 'deploy' ? 'var(--bg-surface)' : 'transparent',
                color: activeTab === 'deploy' ? 'var(--text-primary)' : 'var(--text-secondary)',
                boxShadow: activeTab === 'deploy' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
              }}
            >
              <Globe className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
              <span>Другие хостинги (Vercel / Netlify)</span>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5">
          {activeTab === 'qr' ? (
            <>
              {/* Important Explanation Note */}
              <div
                className="p-3.5 rounded-2xl border text-xs flex items-start gap-3"
                style={{
                  backgroundColor: 'var(--accent-soft)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent-text)',
                }}
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold block">Почему у друга ссылка могла не открыться?</span>
                  <p className="text-[11px] leading-relaxed opacity-90">
                    Ссылка <code>ais-dev</code> открывается <b>только в вашем аккаунте</b>. Чтобы публичная ссылка заработала для всех, нажмите кнопку <b>«Share» (Поделиться)</b> в правом верхнем углу интерфейса Google AI Studio!
                  </p>
                </div>
              </div>

              {/* QR Code Card */}
              <div
                className="p-5 rounded-3xl border text-center space-y-3.5 flex flex-col items-center justify-center"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-muted)' }}>
                  <QrCode className="w-3.5 h-3.5" style={{ color: 'var(--accent-primary)' }} />
                  <span>Сканирование с камеры смартфона (Android & iOS)</span>
                </span>

                <div className="p-3 bg-white rounded-2xl shadow-md border border-slate-200">
                  {qrDataUrl ? (
                    <img
                      src={qrDataUrl}
                      alt="QR-код для демонстрации"
                      className="w-48 h-48 sm:w-52 sm:h-52 object-contain"
                    />
                  ) : (
                    <div className="w-48 h-48 sm:w-52 sm:h-52 flex items-center justify-center text-xs text-slate-400">
                      Генерация QR-кода...
                    </div>
                  )}
                </div>

                <p className="text-xs max-w-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Друг может просто открыть камеру на своем <b>Android</b> или <b>iPhone</b> и навести на этот QR-код — сайт откроется в браузере.
                </p>
              </div>

              {/* Direct Link & Copy */}
              <div className="space-y-2">
                <label className="text-xs font-bold block" style={{ color: 'var(--text-primary)' }}>
                  Прямая публичная ссылка для отправки:
                </label>
                <div
                  className="p-2 sm:p-2.5 rounded-2xl border flex items-center justify-between gap-2"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <span className="text-xs font-mono truncate px-2 select-all" style={{ color: 'var(--text-secondary)' }}>
                    {demoUrl}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="px-3.5 py-2 rounded-xl text-xs font-bold text-white transition-all cursor-pointer shrink-0 flex items-center gap-1.5 shadow-xs active:scale-95"
                    style={{ backgroundColor: copied ? '#10b981' : 'var(--accent-primary)' }}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Скопировано!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Копировать</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Quick Share Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <a
                  href={telegramShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: '#229ED9',
                    borderColor: '#229ED9',
                    color: '#FFFFFF',
                  }}
                >
                  <Send className="w-4 h-4" />
                  <span>Отправить ссылку в Telegram</span>
                </a>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="p-3 rounded-2xl border text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer hover:opacity-95"
                  style={{
                    backgroundColor: 'var(--bg-elevated)',
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <Share2 className="w-4 h-4" style={{ color: 'var(--accent-primary)' }} />
                  <span>Поделиться через меню смартфона</span>
                </button>
              </div>
            </>
          ) : (
            /* External Hosting Tab */
            <div className="space-y-4">
              <div
                className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    1
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Netlify Drop — Самый быстрый бесплатный способ (10 секунд без консоли)
                  </h3>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Готовая скомпилированная сборка сайта уже сформирована. Вы можете скачать её в 1 клик и перетащить в бесплатный сервис Netlify Drop:
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="/api/download/build"
                    download="kompany-build.zip"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-xs cursor-pointer active:scale-95"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Download className="w-4 h-4" />
                    <span>Скачать архив сайта (.ZIP, 275 KB)</span>
                  </a>

                  <a
                    href="https://app.netlify.com/drop"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-semibold border cursor-pointer hover:opacity-95"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Открыть Netlify Drop</span>
                  </a>
                </div>

                <span className="text-[11px] block pt-1" style={{ color: 'var(--text-muted)' }}>
                  Шаг: скачайте архив <code>kompany-build.zip</code>, распакуйте его и просто перетащите полученную папку на страницу Netlify Drop — через 5 секунд получите бесплатную постоянную ссылку, доступную с любых телефонов!
                </span>
              </div>

              {/* Vercel Option */}
              <div
                className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    2
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Ваш GitHub Репозиторий и GitHub Pages
                  </h3>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  Проект успешно выгружен в ваш личный GitHub! Включена автоматическая публикация на <b>GitHub Pages</b>:
                </p>

                <div className="pt-2 flex flex-wrap gap-2">
                  <a
                    href="https://nako4343-cmyk.github.io/kompany-app/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white cursor-pointer active:scale-95"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    <Globe className="w-3.5 h-3.5" />
                    <span>Открыть демо на GitHub Pages</span>
                    <ExternalLink className="w-3 h-3 opacity-80" />
                  </a>

                  <a
                    href="https://github.com/nako4343-cmyk/kompany-app"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer hover:opacity-95"
                    style={{
                      backgroundColor: 'var(--bg-surface)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Репозиторий на GitHub</span>
                  </a>
                </div>
              </div>

              {/* AI Studio Official Share Option */}
              <div
                className="p-4 rounded-2xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-elevated)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs"
                    style={{
                      backgroundColor: 'var(--accent-soft)',
                      color: 'var(--accent-primary)',
                    }}
                  >
                    3
                  </div>
                  <h3 className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>
                    Публикация прямо в Google AI Studio (без сторонних сайтов)
                  </h3>
                </div>

                <p className="text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                  В верхнем правом углу Google AI Studio нажмите кнопку <b>«Share»</b> и выберите <b>«Publish app»</b>. Ссылка сразу станет активной для всех устройств без логина!
                </p>
              </div>
            </div>
          )}

          {/* Interactive Walkthrough Tips for Friends */}
          <div
            className="p-4 rounded-2xl border space-y-2.5"
            style={{
              backgroundColor: 'var(--accent-soft)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: 'var(--accent-text)' }}>
              <Sparkles className="w-3.5 h-3.5" />
              <span>Что показать друзьям в демо:</span>
            </span>

            <ul className="text-xs space-y-2 leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">1.</span>
                <span><b>Защита приватности</b>: точный адрес и телефон скрыты плашкой «Адрес скрыт» до одобрения заявки организатором.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">2.</span>
                <span><b>Переключение ролей</b>: в верхней панели переключайтесь между Анной, Михаилом и Еленой в 1 клик, чтобы увидеть сервис с обеих сторон.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">3.</span>
                <span><b>Быстрые фильтры</b>: над лентой можно включить «Только поблизости», «Самые популярные» или «По интересам».</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-500 font-bold shrink-0">4.</span>
                <span><b>Фотогалереи и отзывы</b>: в профилях участников можно листать фотографии в полноэкранном лайтбоксе и читать отзывы о совместных встречах.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};
