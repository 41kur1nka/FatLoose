import type {
  AppData,
  HiitPreset,
  MobilityRoutine,
  StrengthTemplate,
} from '../types';

export const EXERCISE_LIBRARY: { group: string; items: string[] }[] = [
  {
    group: 'Грудь',
    items: [
      'Жим штанги лёжа',
      'Жим гантелей на наклонной',
      'Отжимания на брусьях',
      'Сведение рук в тренажёре (бабочка)',
      'Отжимания от пола',
    ],
  },
  {
    group: 'Спина',
    items: [
      'Подтягивания',
      'Тяга верхнего блока',
      'Тяга штанги в наклоне',
      'Тяга гантели одной рукой',
      'Горизонтальная тяга блока',
      'Гиперэкстензия',
    ],
  },
  {
    group: 'Ноги',
    items: [
      'Приседания со штангой',
      'Жим ногами в тренажёре',
      'Румынская тяга',
      'Выпады с гантелями',
      'Сгибание ног лёжа',
      'Разгибание ног сидя',
      'Подъём на носки стоя',
    ],
  },
  {
    group: 'Плечи',
    items: [
      'Жим гантелей сидя',
      'Армейский жим стоя',
      'Махи гантелями в стороны',
      'Разведение в наклоне (задняя дельта)',
      'Тяга к лицу (Face Pull)',
    ],
  },
  {
    group: 'Руки и Кор',
    items: [
      'Подъём штанги на бицепс',
      'Молотки с гантелями',
      'Разгибание на трицепс в блоке',
      'Французский жим',
      'Скручивания на пресс',
      'Подъём ног в висе',
      'Планка',
    ],
  },
];

export const DEFAULT_STRENGTH_TEMPLATES: StrengthTemplate[] = [
  {
    id: 'tpl-upper',
    name: 'Верх тела',
    subtitle: 'Грудь, спина, плечи и руки',
    exercises: [
      { name: 'Жим штанги лёжа', defaultSets: 4, defaultReps: 8 },
      { name: 'Тяга верхнего блока', defaultSets: 4, defaultReps: 10 },
      { name: 'Жим гантелей на наклонной', defaultSets: 3, defaultReps: 10 },
      { name: 'Горизонтальная тяга блока', defaultSets: 3, defaultReps: 12 },
      { name: 'Махи гантелями в стороны', defaultSets: 3, defaultReps: 15 },
      { name: 'Разгибание на трицепс в блоке', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'tpl-lower',
    name: 'Низ тела + Кор',
    subtitle: 'Ноги, ягодицы и пресс',
    exercises: [
      { name: 'Приседания со штангой', defaultSets: 4, defaultReps: 8 },
      { name: 'Румынская тяга', defaultSets: 4, defaultReps: 10 },
      { name: 'Жим ногами в тренажёре', defaultSets: 3, defaultReps: 12 },
      { name: 'Сгибание ног лёжа', defaultSets: 3, defaultReps: 12 },
      { name: 'Подъём ног в висе', defaultSets: 3, defaultReps: 12 },
    ],
  },
  {
    id: 'tpl-fullbody',
    name: 'Фулбоди (База)',
    subtitle: 'Всё тело за одну тренировку',
    exercises: [
      { name: 'Приседания со штангой', defaultSets: 3, defaultReps: 10 },
      { name: 'Жим гантелей на наклонной', defaultSets: 3, defaultReps: 10 },
      { name: 'Подтягивания', defaultSets: 3, defaultReps: 8 },
      { name: 'Румынская тяга', defaultSets: 3, defaultReps: 10 },
      { name: 'Жим гантелей сидя', defaultSets: 3, defaultReps: 12 },
      { name: 'Скручивания на пресс', defaultSets: 3, defaultReps: 15 },
    ],
  },
];

export const DEFAULT_HIIT_PRESETS: HiitPreset[] = [
  {
    id: 'hiit-tabata',
    name: 'Классическая Табата',
    subtitle: 'Максимум интенсивности за 4 минуты',
    warmupSec: 10,
    workSec: 20,
    restSec: 10,
    rounds: 8,
    exercises: [
      'Бёрпи (или без прыжка)',
      'Скалолаз (Mountain Climbers)',
      'Приседания в темпе',
      'Джампинг Джекс',
    ],
  },
  {
    id: 'hiit-fatburn',
    name: 'Домашнее жиросжигание',
    subtitle: '12 минут — без оборудования, на всё тело',
    warmupSec: 15,
    workSec: 40,
    restSec: 20,
    rounds: 12,
    exercises: [
      'Джампинг Джекс',
      'Приседания + подъём колена',
      'Отжимания (или с колен)',
      'Скалолаз',
      'Выпады назад поочерёдно',
      'Планка с касанием плеч',
    ],
  },
  {
    id: 'hiit-quick',
    name: 'Быстрый разгон 30/15',
    subtitle: '7.5 минут, когда мало времени',
    warmupSec: 10,
    workSec: 30,
    restSec: 15,
    rounds: 10,
    exercises: [
      'Высокое поднимание коленей',
      'Приседания сумо',
      'Отжимания',
      'Велосипед на пресс',
      'Конькобежец (прыжки в сторону)',
    ],
  },
  {
    id: 'hiit-core',
    name: 'Пресс и Кор HIIT',
    subtitle: '8 раундов на мышцы кора',
    warmupSec: 10,
    workSec: 35,
    restSec: 15,
    rounds: 8,
    exercises: [
      'Скручивания',
      'Велосипед',
      'Планка на предплечьях',
      'Мёртвый жук (Dead Bug)',
    ],
  },
];

export const DEFAULT_MOBILITY_ROUTINES: MobilityRoutine[] = [
  {
    id: 'mob-morning',
    name: 'Утренняя зарядка',
    category: 'morning',
    subtitle: 'Разбудить суставы и спину за 6 минут',
    steps: [
      { id: 'm1', name: 'Круги шеей и плечами', durationSec: 45, cue: 'Плавно, без резких движений, глубокий вдох' },
      { id: 'm2', name: 'Кошка-Корова (Cat-Cow)', durationSec: 50, cue: 'Прогиб на вдохе, округление спины на выдохе' },
      { id: 'm3', name: 'Раскрытие грудного отдела (Open Book)', durationSec: 40, perSide: true, cue: 'Лёжа на боку, тянемся рукой назад' },
      { id: 'm4', name: 'Выпад «Лучшая растяжка в мире»', durationSec: 40, perSide: true, cue: 'Поворот корпуса вверх к передней ноге' },
      { id: 'm5', name: 'Глубокий присед + раскрытие бёдер', durationSec: 50, cue: 'Локтями мягко разводим колени в стороны' },
      { id: 'm6', name: 'Наклоны вперёд + потягивание вверх', durationSec: 45, cue: 'Расслабь шею и спину, затем потянись к потолку' },
    ],
  },
  {
    id: 'mob-post-gym',
    name: 'Растяжка после зала',
    category: 'stretch',
    subtitle: 'Снять зажимы и ускорить восстановление',
    steps: [
      { id: 's1', name: 'Растяжка грудных у стены / дверного проёма', durationSec: 40, perSide: true, cue: 'Рука под 90°, мягко поворачиваем корпус' },
      { id: 's2', name: 'Поза ребёнка с руками вперёд', durationSec: 60, cue: 'Вытягиваем широчайшие и поясницу' },
      { id: 's3', name: 'Растяжка квадрицепса стоя', durationSec: 40, perSide: true, cue: 'Колени вместе, таз чуть подать вперёд' },
      { id: 's4', name: 'Наклон к прямой ноге (задняя поверхность)', durationSec: 40, perSide: true, cue: 'Спина ровная, тянемся животом к бедру' },
      { id: 's5', name: 'Поза голубя (ягодицы)', durationSec: 45, perSide: true, cue: 'Дыши глубоко, расслабляй таз на выдохе' },
      { id: 's6', name: 'Скручивание лёжа на спине', durationSec: 40, perSide: true, cue: 'Лопатки прижаты к полу, колено тянется в сторону' },
    ],
  },
  {
    id: 'mob-spine-hips',
    name: 'Мобильность спины и таза',
    category: 'mobility',
    subtitle: 'Идеально после сидячего дня за компом',
    steps: [
      { id: 'b1', name: 'Перекаты 90/90 для тазобедренных', durationSec: 60, cue: 'Сидя на полу, плавно перекладываем колени из стороны в сторону' },
      { id: 'b2', name: 'Растяжка сгибателей бедра в выпаде с колена', durationSec: 45, perSide: true, cue: 'Подкрути таз и напряги ягодицу задней ноги' },
      { id: 'b3', name: 'Продёргивание руки (Thread the Needle)', durationSec: 40, perSide: true, cue: 'На четвереньках, плечо тянется к полу' },
      { id: 'b4', name: 'Собака мордой вниз с переступанием', durationSec: 50, cue: 'Поочерёдно тянем пятки к полу, спина прямая' },
      { id: 'b5', name: 'Ягодичный мостик в паузе', durationSec: 50, cue: 'Задержись наверху на 2 секунды, включи ягодицы' },
    ],
  },
];

export const DEFAULT_APP_DATA: AppData = {
  sessions: [],
  strengthTemplates: DEFAULT_STRENGTH_TEMPLATES,
  hiitPresets: DEFAULT_HIIT_PRESETS,
  mobilityRoutines: DEFAULT_MOBILITY_ROUTINES,
  weightEntries: [],
  settings: {
    targetWeightKg: null,
    startWeightKg: null,
    weeklyGoal: 4,
    soundEnabled: true,
    restDays: [],
  },
};
