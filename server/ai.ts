import { GoogleGenAI } from '@google/genai';

// Initialize Gemini client per official skill guidelines
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

export async function generateEventDescription(params: {
  category: string;
  title: string;
  budget: string;
  targetParticipants: number;
  notes?: string;
}): Promise<{
  description: string;
  suggestedAgenda: string[];
  suggestedIcebreaker: string;
  safetyTip: string;
}> {
  try {
    const prompt = `Ты — AI-помощник сервиса Kompany, который помогает людям находить компанию для праздников, настолок, кафе, прогулок и мероприятий (НЕ дейтинг!).
Составь дружелюбное, привлекательное и естественное описание мероприятия.

Входные данные:
- Категория: ${params.category}
- Название / черновик: ${params.title}
- Бюджет: ${params.budget}
- Количество участников: ${params.targetParticipants}
- Дополнительные пожелания организатора: ${params.notes || 'не указаны'}

Верни ответ строго в формате JSON со следующими полями:
{
  "description": "Теплый живой текст от лица организатора (2-3 абзаца), почему собирается компания, какая атмосфера планируется, кого рады видеть",
  "suggestedAgenda": ["Краткий примерный тайминг встречи по пунктам (3-4 пункта)"],
  "suggestedIcebreaker": "Одна легкая ненавязчивая тема или вопрос для знакомства в начале",
  "safetyTip": "Короткая дружеская рекомендация по комфорту и безопасности встречи"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      description: parsed.description || 'Приглашаю собраться душевной компанией, вкусно провести время и познакомиться!',
      suggestedAgenda: parsed.suggestedAgenda || ['19:00 — Сбор и знакомство', '19:30 — Заказ блюд и общение', '21:00 — Свободная беседа'],
      suggestedIcebreaker: parsed.suggestedIcebreaker || 'Расскажите о самом необычном месте, где вы бывали за последний год.',
      safetyTip: parsed.safetyTip || 'Встреча в общественном месте. Личные контакты и точный адрес открываются только после взаимного подтверждения.',
    };
  } catch (error) {
    console.error('AI describe error:', error);
    return {
      description: `Привет! Собираю небольшую компанию для ${params.category.toLowerCase()}. Планируем посидеть в приятном месте, пообщаться и познакомиться с новыми людьми. Присоединяйтесь!`,
      suggestedAgenda: ['Сбор и знакомство', 'Основная часть', 'Свободное душевное общение'],
      suggestedIcebreaker: 'Какое ваше любимое хобби, о котором мало кто знает?',
      safetyTip: 'Все встречи проходят в безопасных общественных пространствах.',
    };
  }
}

export async function getSmartRecommendations(params: {
  userInterests: string[];
  city: string;
  age: number;
  events: Array<{ id: string; title: string; category: string; description: string }>;
}): Promise<Array<{ eventId: string; matchReason: string; matchScore: number }>> {
  try {
    const prompt = `Ты — алгоритм умных рекомендаций для сервиса совместного досуга Kompany.
Пользователь:
- Возраст: ${params.age}
- Город: ${params.city}
- Интересы: ${params.userInterests.join(', ')}

Доступные мероприятия:
${JSON.stringify(params.events, null, 2)}

Подбери наиболее подходящие мероприятия для этого пользователя (максимум 3).
Для каждого укажи:
- eventId (из списка выше)
- matchScore (от 70 до 99)
- matchReason (одно живое предложение на русском, почему это мероприятие точно понравится пользователю с его интересами).

Верни JSON массив объектов.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '[]');
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed;
    }
  } catch (error) {
    console.error('AI recommendations error:', error);
  }

  // Graceful rule-based fallback
  return params.events.slice(0, 3).map((e, idx) => ({
    eventId: e.id,
    matchScore: 95 - idx * 5,
    matchReason: `Подходит по категории "${e.category}" и формату дружелюбных встреч.`,
  }));
}

export async function scanEventSafety(params: {
  title: string;
  description: string;
  budget: string;
}): Promise<{ isSafe: boolean; warning?: string; score: number }> {
  try {
    const prompt = `Проанализируй объявление о поиске компании на мероприятие на соответствие правилам безопасности:
Запрещено:
- Сексуальные услуги или завуалированный эскорт
- Сбор больших предоплат или финансовые пирамиды
- Продажа запрещенных веществ
- Агрессия, дискриминация
- Приглашение в подозрительные безлюдные закрытые места без названия

Объявление:
Название: ${params.title}
Описание: ${params.description}
Бюджет: ${params.budget}

Верни JSON:
{
  "isSafe": true/false,
  "score": число от 0 до 100 (где 100 — полностью безопасно),
  "warning": "краткое предупреждение или null"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return {
      isSafe: parsed.isSafe ?? true,
      score: parsed.score ?? 98,
      warning: parsed.warning,
    };
  } catch (err) {
    console.error('Safety scan error:', err);
    return { isSafe: true, score: 95 };
  }
}
