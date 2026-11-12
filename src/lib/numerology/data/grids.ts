/** Lo Shu + Vedic grid layouts, planes/arrows/yogs and Lo Shu element remedies. Expert-overridable. */

export const LOSHU_LAYOUT: number[][] = [
  [4, 9, 2],
  [3, 5, 7],
  [8, 1, 6],
];

/** Vedic (planet-mapped) grid: Jupiter Sun Mars / Venus Ketu Mercury / Moon Saturn Rahu */
export const VEDIC_LAYOUT: number[][] = [
  [3, 1, 9],
  [6, 7, 5],
  [2, 8, 4],
];

export interface GridLine {
  id: string;
  name: string;
  numbers: [number, number, number];
  orientation: 'horizontal' | 'vertical' | 'diagonal';
  /** Name used when all three numbers are present. */
  strengthName: string;
  /** Name used when all three numbers are missing. */
  weaknessName: string;
  /**
   * Yog label when complete (Indian Lo Shu terminology), if any.
   * Golden Yog = 4-5-6 (success line), Silver Yog = 2-5-8 (property line). The 3-5-7 plane is not a yog.
   * Arrow names on the four lines through 5 follow the numbers (1-5-9 determination / indecision,
   * 3-5-7 spirituality / scepticism, 4-5-6 willpower / frustration, 2-5-8 emotional balance / hypersensitivity).
   */
  yog?: string;
}

export const LOSHU_LINES: GridLine[] = [
  { id: 'mental', name: 'Mental Plane', numbers: [4, 9, 2], orientation: 'horizontal', strengthName: 'Arrow of Intellect', weaknessName: 'Arrow of Poor Memory' },
  { id: 'emotional', name: 'Emotional Plane', numbers: [3, 5, 7], orientation: 'horizontal', strengthName: 'Arrow of Spirituality', weaknessName: 'Arrow of Scepticism' },
  { id: 'practical', name: 'Practical Plane', numbers: [8, 1, 6], orientation: 'horizontal', strengthName: 'Arrow of Practicality', weaknessName: 'Arrow of Disorder' },
  { id: 'thought', name: 'Thought Plane', numbers: [4, 3, 8], orientation: 'vertical', strengthName: 'Arrow of Planning', weaknessName: 'Arrow of Confusion' },
  { id: 'will', name: 'Will Plane', numbers: [9, 5, 1], orientation: 'vertical', strengthName: 'Arrow of Determination', weaknessName: 'Arrow of Indecision' },
  { id: 'action', name: 'Action Plane', numbers: [2, 7, 6], orientation: 'vertical', strengthName: 'Arrow of Activity', weaknessName: 'Arrow of Hesitation' },
  { id: 'golden', name: 'Success Line (4-5-6)', numbers: [4, 5, 6], orientation: 'diagonal', strengthName: 'Arrow of Willpower', weaknessName: 'Arrow of Frustration', yog: 'Golden Yog' },
  { id: 'raj', name: 'Property Line (2-5-8)', numbers: [2, 5, 8], orientation: 'diagonal', strengthName: 'Arrow of Emotional Balance', weaknessName: 'Arrow of Hypersensitivity', yog: 'Silver Yog' },
];

export interface LoShuNumberInfo {
  number: number;
  element: 'Water' | 'Earth' | 'Wood' | 'Metal' | 'Fire';
  direction: string;
  colour: string;
  crystal: string;
  placement: string;
  wristband: string;
  dailyHabit: string;
}

export const LOSHU_NUMBER_INFO: Record<number, LoShuNumberInfo> = {
  1: { number: 1, element: 'Water', direction: 'North', colour: 'Blue / Black', crystal: 'Aquamarine', placement: 'Small water fountain or metal tortoise in the North', wristband: 'Black tourmaline bracelet', dailyHabit: 'Speak up for yourself once a day; write your goals each morning.' },
  2: { number: 2, element: 'Earth', direction: 'South-West', colour: 'White / Cream', crystal: 'Rose quartz / Moonstone', placement: 'Pair of rose quartz or a couple photograph in the South-West', wristband: 'Moonstone bracelet', dailyHabit: 'Drink water from a silver glass; spend 10 calm minutes without screens.' },
  3: { number: 3, element: 'Wood', direction: 'East', colour: 'Green', crystal: 'Green aventurine', placement: 'Healthy green plants in the East', wristband: 'Green aventurine bracelet', dailyHabit: 'Read or learn something new for 15 minutes daily.' },
  4: { number: 4, element: 'Wood', direction: 'South-East', colour: 'Green', crystal: 'Green jade', placement: 'Money plant or bamboo in the South-East', wristband: 'Green jade bracelet', dailyHabit: 'Plan the next day in writing every night.' },
  5: { number: 5, element: 'Earth', direction: 'Centre', colour: 'Yellow / Earth tones', crystal: 'Citrine', placement: 'Keep the centre of the home clutter-free; place a crystal bowl there', wristband: 'Citrine bracelet', dailyHabit: 'Walk for 20 minutes; keep your wallet and desk organised.' },
  6: { number: 6, element: 'Metal', direction: 'North-West', colour: 'White / Silver', crystal: 'Clear quartz', placement: 'Metal wind chime (6 rods) in the North-West', wristband: 'Clear quartz bracelet', dailyHabit: 'Help a family member each day; keep a fragrance at home.' },
  7: { number: 7, element: 'Metal', direction: 'West', colour: 'White / Grey', crystal: 'Amethyst', placement: 'Metal bowl or brass items in the West', wristband: 'Amethyst bracelet', dailyHabit: 'Meditate for 10 minutes; spend time in nature weekly.' },
  8: { number: 8, element: 'Earth', direction: 'North-East', colour: 'Yellow / Brown', crystal: 'Tiger’s eye', placement: 'Crystal ball or earthen pot in the North-East', wristband: 'Tiger’s eye bracelet', dailyHabit: 'Track money daily; serve elders or labourers when you can.' },
  9: { number: 9, element: 'Fire', direction: 'South', colour: 'Red', crystal: 'Red jasper / Carnelian', placement: 'Red lamp or candle in the South', wristband: 'Red jasper bracelet', dailyHabit: 'Exercise in the morning; channel anger into physical activity.' },
};
