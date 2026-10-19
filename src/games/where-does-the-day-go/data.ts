/** Hours per day for the U.S. civilian population age 15+, ATUS 2023 (BLS, released 27 June 2024), Table 1.
 * Averages include people who did not do the activity that day.
 * "Everything else" is 24 minus the listed rows, so the day adds up exactly.
 */
export const ACTIVITIES = [
  { id: 'sleep', name: 'Sleeping', hours: 9.07 },
  { id: 'leisure', name: 'Leisure and sports', hours: 5.15 },
  { id: 'work', name: 'Working', hours: 3.26 },
  { id: 'home', name: 'Household activities', hours: 1.92 },
  { id: 'eat', name: 'Eating and drinking', hours: 1.2 },
  { id: 'groom', name: 'Other personal care', hours: 0.77 },
  { id: 'other', name: 'Everything else', hours: 2.63 },
] as const;

export const DAY = 24;
