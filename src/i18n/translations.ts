export type AppLanguage = 'ru' | 'es';

export interface LanguageOption {
  id: AppLanguage;
  label: string;
  shortLabel: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'ru', label: 'Русский', shortLabel: 'RU', nativeName: 'Русский' },
  { id: 'es', label: 'Español', shortLabel: 'ES', nativeName: 'Español' },
];

const CATEGORY_ES_MAP: Record<string, string> = {
  'Все': 'Todos',
  'Все события': 'Todos los eventos',
  'Сегодня': 'Hoy',
  'Сегодня вечером': 'Esta noche',
  'Сохраненные': 'Guardados',
  'День рождения': 'Cumpleaños',
  'Свадьба': 'Boda',
  'Ресторан / Бар': 'Restaurante / Bar',
  'Рестораны / Бары': 'Restaurantes / Bares',
  'Настольные игры': 'Juegos de mesa',
  'Кино / Концерт': 'Cine / Concierto',
  'Пикник / Шашлыки': 'Picnic / Barbacoa',
  'Спорт': 'Deporte',
  'Прогулка': 'Paseo',
  'Путешествие': 'Viajes',
  'Вечеринка': 'Fiesta',
  'Квиз / Интеллект': 'Quiz / Trivia',
  'Искусство': 'Arte',
  'Музыка': 'Música',
  'Технологии': 'Tecnología',
  'Другое': 'Otro',
};

const DISTRICT_ES_MAP: Record<string, string> = {
  'Патриаршие пруды': 'Estanques del Patriarca',
  'Чистые пруды': 'Chístye Prudý',
  'Парк Горького': 'Parque Gorki',
  'Хамовники': 'Jamóvniki',
  'Красная Пресня': 'Krásnaya Presnya',
  'Китай-город': 'Kitái-Górod',
  'Тверская': 'Tverskaya',
  'Замоскворечье': 'Zamoskvoréchye',
  'Арбат': 'Arbat',
  'Басманный': 'Basmanny',
  'Серебряный Бор': 'Serebryany Bor',
  'Центр': 'Centro',
};

const VIBE_ES_MAP: Record<string, string> = {
  'Спокойная беседа': 'Charla tranquila',
  'Гастро-вечер': 'Velada gastronómica',
  'Интеллектуальная игра': 'Juego intelectual',
  'Активный движ': 'Plan activo',
  'Праздничный вайб': 'Ambiente festivo',
};

export function translateCategory(cat: string, lang: AppLanguage): string {
  if (lang === 'ru') return cat;
  return CATEGORY_ES_MAP[cat] || cat;
}

export function translateDistrict(district: string, lang: AppLanguage): string {
  if (lang === 'ru') return district;
  for (const [ruKey, esVal] of Object.entries(DISTRICT_ES_MAP)) {
    if (district.includes(ruKey)) {
      return district.replace(ruKey, esVal).replace('км от вас', 'km de ti').replace('км', 'km');
    }
  }
  return district.replace('км от вас', 'km de ti').replace('км', 'km');
}

export function translateVibe(vibe: string, lang: AppLanguage): string {
  if (lang === 'ru') return vibe;
  return VIBE_ES_MAP[vibe] || vibe;
}

export const UI_TEXT = {
  ru: {
    // Header & Navigation
    brandTagline: 'Твоя компания на вечер',
    navFeed: 'Лента',
    navToday: 'Сегодня',
    navChats: 'Мои события',
    navNotifications: 'Уведомления',
    navProfile: 'Профиль',
    createEventBtn: 'Создать событие',
    createShortBtn: 'Создать',
    themeBtnTitle: 'Тема оформления',
    themeMenuHeader: 'Палитра интерфейса',
    langBtnTitle: 'Язык приложения',
    langMenuHeader: 'Язык / Idioma',
    notificationsTitle: 'Уведомления',
    notificationsUnread: 'новых',
    notificationsMarkAllRead: 'Прочитать все',
    notificationsEmptyTitle: 'У вас пока нет уведомлений',
    notificationsEmptySub: 'Здесь появятся отклики на ваши события и статусы заявок.',
    switchDemoAccount: 'Сменить демо-аккаунт (тест ролей)',
    safetyBtnTitle: 'Правила безопасности',
    shareBtnTitle: 'Поделиться ссылкой на приложение',
    adminBtnTitle: 'Панель модератора',

    // Bento Hero
    heroKicker: 'Социальный радар проверенных встреч · Москва',
    heroTitleLine1: 'Компания на вечер,',
    heroTitleHighlight: 'которой можно доверять',
    heroDescription: 'Камерные ужины, настольные игры, дни рождения, свадьбы и спонтанные вылазки в городе. Точный адрес и закрытый чат открываются только после подтверждения вашей заявки организатором.',
    heroSearchPlaceholder: 'Поиск по району, заведению или интересу...',
    heroFindMatchBtn: 'Подобрать компанию',
    heroCreateBtn: 'Создать встречу',
    heroStatEvents: 'Активных встреч',
    heroStatTonight: 'Сегодня вечером',
    heroStatTrust: 'Ваш рейтинг доверия',
    heroPrivacyTitle: 'Приватность локаций',
    heroPrivacyDesc: 'До одобрения виден только район и ориентир. Никаких случайных гостей.',
    radarCardBadge: 'Яндекс Карты Live',
    radarCardTitle: 'Радар событий на Яндекс Картах',
    radarCardDesc: 'Откройте интерактивную Яндекс Карту Москвы с метками встреч, фильтрацией по районам и радиусами приватности.',
    radarCardCta: 'Открыть радар Яндекс Карт',

    // Feed & QuickFilters
    feedAllTitle: 'Все актуальные компании',
    feedTodayTitle: 'События сегодня вечером',
    feedFoundPrefix: 'Найдено',
    feedFoundSuffix: 'мероприятий · адрес открывается после одобрения заявки',
    viewCards: 'Карточки',
    viewRadar: 'Радар Яндекс Карт',
    quickAll: 'Все',
    quickNearby: 'Поблизости',
    quickPopular: 'Популярные',
    quickInterests: 'По интересам',
    quickNearbyDesc: 'события в радиусе до 3 км',
    quickPopularDesc: 'компании с высокой активностью и набором участников',
    quickInterestsDesc: 'По вашим интересам:',
    resetFilter: 'Сбросить',
    emptyEventsTitle: 'Мероприятия не найдены',
    emptyEventsDesc: 'Попробуйте выбрать другую категорию или создайте собственную встречу за 1 минуту!',
    createEventAction: 'Создать мероприятие',

    // My Events & Participation Statuses
    myEventsTitle: 'Мои события и закрытые чаты',
    myEventsSubtitle: 'Доступ к чату и точному адресу открыт только организатору и подтвержденным участникам.',
    organizedByMeHeader: 'Я организую',
    joinedByMeHeader: 'Я участвую',
    statusAll: 'Все',
    statusApproved: 'Принят',
    statusPending: 'Ожидает одобрения',
    statusRejected: 'Отклонен',
    statusApprovedSub: 'Точный адрес и закрытый чат участников открыты',
    statusPendingSub: 'Организатор рассматривает вашу заявку · точный адрес пока скрыт',
    statusRejectedSub: 'К сожалению, группа уже укомплектована или заявка отклонена',
    openChatBtn: 'Открыть чат',
    applicationsAndDetailsBtn: 'Заявки и детали',
    detailsBtn: 'Подробнее',

    // Event Card
    tonightBadge: 'Сегодня вечером',
    todayWord: 'Сегодня',
    addressUnlockedShort: 'Адрес открыт',
    addressHiddenShort: 'Адрес скрыт',
    attendanceRateLabel: 'явка',
    budgetHint: 'ориентир',
    spotsOf: 'из',
    peopleShort: 'чел.',
    spotsFull: 'мест нет',
    spotsAvailablePrefix: 'свободно',
    youAreHost: 'Вы хост',
    fullBadge: 'Заполнено',
    joinCompanyBtn: 'В компанию',

    // Map / Radar View (Yandex Maps)
    mapBadge: 'Гео-радар событий • Яндекс Карты',
    mapTitle: 'Интерактивный радар на Яндекс Картах',
    mapSubtitle: 'Для безопасности организаторов до одобрения заявки на карте показывается ориентир района (~500 м).',
    mapModeYandex: 'Яндекс Карта',
    mapModeSchematic: 'Схема радара',
    mapAllMoscow: 'Вся Москва',
    mapOpenExternal: 'Открыть в Яндекс Картах',
    mapSelectedZone: 'Фокус карты',
    mapPrivacyNotice: 'Приватный гео-режим: точные адреса открываются участникам после подтверждения',
    mapCenterMoscow: 'Москва • Все активные встречи',
    mapShowOnYandex: 'Показать на Яндекс Карте',
    mapBuildRoute: 'Маршрут в Яндекс Картах',
    mapEventsInArea: 'событий на радаре',
  },
  es: {
    // Header & Navigation
    brandTagline: 'Tu compañía para hoy',
    navFeed: 'Eventos',
    navToday: 'Para hoy',
    navChats: 'Mis eventos',
    navNotifications: 'Alertas',
    navProfile: 'Perfil',
    createEventBtn: 'Crear evento',
    createShortBtn: 'Crear',
    themeBtnTitle: 'Tema visual',
    themeMenuHeader: 'Paleta de interfaz',
    langBtnTitle: 'Idioma de la aplicación',
    langMenuHeader: 'Idioma / Язык',
    notificationsTitle: 'Notificaciones',
    notificationsUnread: 'nuevas',
    notificationsMarkAllRead: 'Marcar todo leído',
    notificationsEmptyTitle: 'Aún no tienes notificaciones',
    notificationsEmptySub: 'Aquí aparecerán las solicitudes de tus eventos y estados de participación.',
    switchDemoAccount: 'Cambiar cuenta demo (probar roles)',
    safetyBtnTitle: 'Guía de seguridad',
    shareBtnTitle: 'Compartir enlace de la app',
    adminBtnTitle: 'Panel de moderación',

    // Bento Hero
    heroKicker: 'Radar social de encuentros verificados · Moscú',
    heroTitleLine1: 'Compañía para hoy,',
    heroTitleHighlight: 'en la que puedes confiar',
    heroDescription: 'Cenas privadas, juegos de mesa, cumpleaños, bodas y planes espontáneos en la ciudad. La dirección exacta y el chat privado se desbloquean tras la aprobación del organizador.',
    heroSearchPlaceholder: 'Buscar por barrio, lugar o interés...',
    heroFindMatchBtn: 'Buscar compañía',
    heroCreateBtn: 'Crear encuentro',
    heroStatEvents: 'Eventos activos',
    heroStatTonight: 'Esta noche',
    heroStatTrust: 'Tu nivel de confianza',
    heroPrivacyTitle: 'Privacidad de ubicación',
    heroPrivacyDesc: 'Antes de aprobarse solo se muestra el barrio aproximado. Sin invitados inesperados.',
    radarCardBadge: 'Yandex Maps Live',
    radarCardTitle: 'Radar de eventos en Yandex Maps',
    radarCardDesc: 'Explora el mapa interactivo de Yandex con marcadores de eventos, filtros por distrito y zonas de privacidad.',
    radarCardCta: 'Abrir radar Yandex Maps',

    // Feed & QuickFilters
    feedAllTitle: 'Todos los encuentros activos',
    feedTodayTitle: 'Eventos para esta noche',
    feedFoundPrefix: 'Encontrados',
    feedFoundSuffix: 'eventos · la dirección exacta se abre tras la aprobación',
    viewCards: 'Tarjetas',
    viewRadar: 'Radar Yandex Maps',
    quickAll: 'Todos',
    quickNearby: 'Cerca de mí',
    quickPopular: 'Populares',
    quickInterests: 'Por intereses',
    quickNearbyDesc: 'eventos en un radio de 3 km',
    quickPopularDesc: 'grupos con alta actividad y participación',
    quickInterestsDesc: 'Según tus intereses:',
    resetFilter: 'Limpiar',
    emptyEventsTitle: 'No se encontraron eventos',
    emptyEventsDesc: 'Prueba otra categoría o crea tu propio encuentro en 1 minuto.',
    createEventAction: 'Crear evento',

    // My Events & Participation Statuses
    myEventsTitle: 'Mis eventos y chats privados',
    myEventsSubtitle: 'El acceso al chat y dirección exacta está reservado al organizador y participantes aprobados.',
    organizedByMeHeader: 'Organizo',
    joinedByMeHeader: 'Participo',
    statusAll: 'Todos',
    statusApproved: 'Aceptado',
    statusPending: 'Pendiente de aprobación',
    statusRejected: 'Rechazado',
    statusApprovedSub: 'Dirección exacta y chat grupal privado desbloqueados',
    statusPendingSub: 'El anfitrión está revisando tu solicitud · dirección oculta por ahora',
    statusRejectedSub: 'El grupo ya está completo o la solicitud fue rechazada',
    openChatBtn: 'Abrir chat',
    applicationsAndDetailsBtn: 'Solicitudes y detalles',
    detailsBtn: 'Detalles',

    // Event Card
    tonightBadge: 'Esta noche',
    todayWord: 'Hoy',
    addressUnlockedShort: 'Dirección abierta',
    addressHiddenShort: 'Dirección oculta',
    attendanceRateLabel: 'asistencia',
    budgetHint: 'estimado',
    spotsOf: 'de',
    peopleShort: 'pers.',
    spotsFull: 'sin plazas',
    spotsAvailablePrefix: 'libres:',
    youAreHost: 'Eres anfitrión',
    fullBadge: 'Completo',
    joinCompanyBtn: 'Unirme',

    // Map / Radar View (Yandex Maps)
    mapBadge: 'Geo-radar de eventos • Yandex Maps',
    mapTitle: 'Radar interactivo en Yandex Maps',
    mapSubtitle: 'Por seguridad de los organizadores, antes de aprobar tu solicitud el mapa muestra el centro aproximado del barrio (~500 m).',
    mapModeYandex: 'Yandex Maps',
    mapModeSchematic: 'Radar de zonas',
    mapAllMoscow: 'Todo Moscú',
    mapOpenExternal: 'Abrir en Yandex Maps',
    mapSelectedZone: 'Enfoque del mapa',
    mapPrivacyNotice: 'Modo geo-privado: las direcciones exactas se desbloquean tras la confirmación',
    mapCenterMoscow: 'Moscú • Todos los eventos activos',
    mapShowOnYandex: 'Centrar en Yandex Maps',
    mapBuildRoute: 'Ruta en Yandex Maps',
    mapEventsInArea: 'eventos en el radar',
  },
} as const;
