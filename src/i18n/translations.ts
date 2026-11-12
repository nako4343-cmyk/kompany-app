export type AppLanguage = 'ru' | 'en';

export interface LanguageOption {
  id: AppLanguage;
  label: string;
  shortLabel: string;
  nativeName: string;
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { id: 'ru', label: 'Русский', shortLabel: 'RU', nativeName: 'Русский' },
  { id: 'en', label: 'English', shortLabel: 'EN', nativeName: 'English' },
];

const CATEGORY_EN_MAP: Record<string, string> = {
  'Все': 'All',
  'Все события': 'All Events',
  'Сегодня': 'Today',
  'Сегодня вечером': 'Tonight',
  'Сохраненные': 'Saved',
  'День рождения': 'Birthday',
  'Свадьба': 'Wedding',
  'Ресторан / Бар': 'Restaurant / Bar',
  'Рестораны / Бары': 'Restaurants / Bars',
  'Настольные игры': 'Board Games',
  'Кино / Концерт': 'Cinema / Concert',
  'Пикник / Шашлыки': 'Picnic / BBQ',
  'Спорт': 'Sports',
  'Прогулка': 'City Walk',
  'Путешествие': 'Travel',
  'Вечеринка': 'Party',
  'Квиз / Интеллект': 'Quiz / Trivia',
  'Искусство': 'Art',
  'Музыка': 'Music',
  'Технологии': 'Tech',
  'Другое': 'Other',
};

const DISTRICT_EN_MAP: Record<string, string> = {
  'Патриаршие пруды': 'Patriarch Ponds',
  'Чистые пруды': 'Chistye Prudy',
  'Парк Горького': 'Gorky Park',
  'Хамовники': 'Khamovniki',
  'Красная Пресня': 'Krasnaya Presnya',
  'Китай-город': 'Kitay-Gorod',
  'Тверская': 'Tverskaya',
  'Замоскворечье': 'Zamoskvorechye',
  'Арбат': 'Arbat',
  'Басманный': 'Basmanny',
  'Серебряный Бор': 'Serebryany Bor',
  'Центр': 'City Center',
};

const VIBE_EN_MAP: Record<string, string> = {
  'Спокойная беседа': 'Cozy Conversation',
  'Гастро-вечер': 'Gastro Evening',
  'Интеллектуальная игра': 'Mind Game',
  'Активный движ': 'Active Vibe',
  'Праздничный вайб': 'Festive Mood',
};

export function translateCategory(cat: string, lang: AppLanguage): string {
  if (lang === 'ru') return cat;
  return CATEGORY_EN_MAP[cat] || cat;
}

export function translateDistrict(district: string, lang: AppLanguage): string {
  if (lang === 'ru') return district;
  let result = district;
  for (const [ruKey, enVal] of Object.entries(DISTRICT_EN_MAP)) {
    if (result.includes(ruKey)) {
      result = result.replace(ruKey, enVal);
    }
  }
  return result
    .replace('км от вас', 'km away')
    .replace('берег реки', 'riverbank')
    .replace('км', 'km');
}

export function translateVibe(vibe: string, lang: AppLanguage): string {
  if (lang === 'ru') return vibe;
  return VIBE_EN_MAP[vibe] || vibe;
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
    langMenuHeader: 'Язык / Language',
    notificationsTitle: 'Уведомления',
    notificationsUnread: 'новых',
    notificationsMarkAllRead: 'Прочитать все',
    notificationsEmptyTitle: 'У вас пока нет уведомлений',
    notificationsEmptySub: 'Здесь появятся отклики на ваши события, приглашения и статусы заявок.',
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

    // My Events, Invitations, Applications & Archive
    myEventsTitle: 'Мои события, приглашения и закрытые чаты',
    myEventsSubtitle: 'Доступ к чату и точному адресу открыт организатору и подтвержденным участникам. После завершения дня встречи автоматически переносятся в архив.',
    organizedByMeHeader: 'Я организую',
    joinedByMeHeader: 'Я участвую и приглашения',
    archivedEventsHeader: 'Архив прошедших встреч',
    inviteFromListBtn: 'Добавить из списка',
    inviteUsersSub: 'Подбор людей с меткой «Жду приглашений» по полу, возрасту и интересам',
    statusAll: 'Все',
    statusApproved: 'Принят',
    statusPending: 'Ожидает одобрения',
    statusRejected: 'Отклонен',
    statusInvited: 'Вас пригласили',
    statusApprovedSub: 'Точный адрес и закрытый чат участников открыты',
    statusPendingSub: 'Организатор рассматривает вашу заявку · точный адрес пока скрыт',
    statusInvitedSub: 'Организатор пригласил вас на эту встречу · примите или отклоните заявку',
    statusRejectedSub: 'Заявка отклонена или отменена',
    openChatBtn: 'Открыть чат',
    applicationsAndDetailsBtn: 'Заявки и детали',
    detailsBtn: 'Подробнее',
    acceptBtn: 'Принять',
    rejectApplicationBtn: 'Отклонить заявку',
    declineInviteBtn: 'Отклонить',
    archivedBadge: 'В архиве · день прошёл',

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
  en: {
    // Header & Navigation
    brandTagline: 'Your company for tonight',
    navFeed: 'Explore',
    navToday: 'Tonight',
    navChats: 'My Events',
    navNotifications: 'Alerts',
    navProfile: 'Profile',
    createEventBtn: 'Create Event',
    createShortBtn: 'Create',
    themeBtnTitle: 'Color Theme',
    themeMenuHeader: 'Interface Palette',
    langBtnTitle: 'App Language',
    langMenuHeader: 'Language / Язык',
    notificationsTitle: 'Notifications',
    notificationsUnread: 'new',
    notificationsMarkAllRead: 'Mark all read',
    notificationsEmptyTitle: 'No notifications yet',
    notificationsEmptySub: 'Event applications, invitations, and status updates will appear here.',
    switchDemoAccount: 'Switch Demo Account (Role Test)',
    safetyBtnTitle: 'Safety Guidelines',
    shareBtnTitle: 'Share App Link',
    adminBtnTitle: 'Moderator Panel',

    // Bento Hero
    heroKicker: 'Social radar of verified meetups · Moscow',
    heroTitleLine1: 'Company for tonight',
    heroTitleHighlight: 'you can truly trust',
    heroDescription: 'Cozy dinners, board games, birthdays, weddings, and spontaneous city hangouts. Exact address and private group chat unlock only after the host approves your request.',
    heroSearchPlaceholder: 'Search by district, venue, or interest...',
    heroFindMatchBtn: 'Find Company',
    heroCreateBtn: 'Create Event',
    heroStatEvents: 'Active Meetups',
    heroStatTonight: 'Tonight',
    heroStatTrust: 'Your Trust Score',
    heroPrivacyTitle: 'Location Privacy',
    heroPrivacyDesc: 'Only the approximate district is visible before approval. No uninvited guests.',
    radarCardBadge: 'Yandex Maps Live',
    radarCardTitle: 'Event Radar on Yandex Maps',
    radarCardDesc: 'Explore interactive Yandex Maps with event pins, district filters, and privacy zones.',
    radarCardCta: 'Open Yandex Maps Radar',

    // Feed & QuickFilters
    feedAllTitle: 'Upcoming Active Meetups',
    feedTodayTitle: 'Happening Tonight',
    feedFoundPrefix: 'Found',
    feedFoundSuffix: 'events · exact address unlocks after approval',
    viewCards: 'Cards',
    viewRadar: 'Yandex Maps Radar',
    quickAll: 'All',
    quickNearby: 'Nearby',
    quickPopular: 'Popular',
    quickInterests: 'For You',
    quickNearbyDesc: 'events within 3 km radius',
    quickPopularDesc: 'trending groups with active participants',
    quickInterestsDesc: 'Matches your interests:',
    resetFilter: 'Reset',
    emptyEventsTitle: 'No events found',
    emptyEventsDesc: 'Try selecting another category or create your own meetup in 1 minute!',
    createEventAction: 'Create Event',

    // My Events, Invitations, Applications & Archive
    myEventsTitle: 'My Events, Invitations & Private Chats',
    myEventsSubtitle: 'Chat and exact address are unlocked for the host and approved guests. Past events automatically move to the archive after their date passes.',
    organizedByMeHeader: 'Hosted by Me',
    joinedByMeHeader: 'Participating & Invitations',
    archivedEventsHeader: 'Archive of Past Meetups',
    inviteFromListBtn: 'Add from List',
    inviteUsersSub: 'Filter users who are open to invites by gender, age, and interests',
    statusAll: 'All',
    statusApproved: 'Approved',
    statusPending: 'Pending Approval',
    statusRejected: 'Declined',
    statusInvited: 'Invited by Host',
    statusApprovedSub: 'Exact address and private group chat are unlocked',
    statusPendingSub: 'Host is reviewing your request · exact address hidden for now',
    statusInvitedSub: 'The organizer invited you to join · accept or decline below',
    statusRejectedSub: 'Application was declined or cancelled',
    openChatBtn: 'Open Chat',
    applicationsAndDetailsBtn: 'Requests & Details',
    detailsBtn: 'Details',
    acceptBtn: 'Accept',
    rejectApplicationBtn: 'Decline Request',
    declineInviteBtn: 'Decline',
    archivedBadge: 'Archived · Day Passed',

    // Event Card
    tonightBadge: 'Tonight',
    todayWord: 'Today',
    addressUnlockedShort: 'Address Unlocked',
    addressHiddenShort: 'Address Hidden',
    attendanceRateLabel: 'attendance',
    budgetHint: 'estimate',
    spotsOf: 'of',
    peopleShort: 'ppl',
    spotsFull: 'full',
    spotsAvailablePrefix: 'open:',
    youAreHost: 'You Host',
    fullBadge: 'Full',
    joinCompanyBtn: 'Join Group',

    // Map / Radar View (Yandex Maps)
    mapBadge: 'Event Geo-Radar • Yandex Maps',
    mapTitle: 'Interactive Radar on Yandex Maps',
    mapSubtitle: 'For host safety, the map shows an approximate district landmark (~500 m) until your request is approved.',
    mapModeYandex: 'Yandex Map',
    mapModeSchematic: 'Zone Radar',
    mapAllMoscow: 'All Moscow',
    mapOpenExternal: 'Open in Yandex Maps',
    mapSelectedZone: 'Map Focus',
    mapPrivacyNotice: 'Private Geo-Mode: exact addresses unlock for approved participants',
    mapCenterMoscow: 'Moscow • All Active Meetups',
    mapShowOnYandex: 'Focus on Yandex Map',
    mapBuildRoute: 'Route in Yandex Maps',
    mapEventsInArea: 'events on radar',
  },
} as const;
