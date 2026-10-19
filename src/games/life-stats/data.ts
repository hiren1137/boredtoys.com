/**
 * World population on 1 July of each year, in millions.
 * 1950–2023: UN World Population Prospects 2024 estimates.
 * 2024–2035: UN World Population Prospects 2024 medium-variant projections.
 * Taken from Our World in Data's "Population" charts, which republish WPP 2024 for these years.
 */
const RAW =
  '2493,2537,2584,2634,2686,2740,2795,2853,2911,2966,3015,3065,3123,3193,3264,3335,3404,3473,3545,3619,' +
  '3695,3770,3845,3921,3996,4071,4144,4218,4292,4369,4448,4529,4613,4697,4782,4869,4958,5050,5142,5234,' +
  '5328,5419,5506,5592,5676,5759,5842,5925,6007,6089,6172,6255,6338,6420,6503,6587,6671,6757,6844,6933,' +
  '7022,7111,7201,7292,7382,7470,7559,7646,7730,7811,7887,7954,8021,8092,8162,8232,8301,8369,8437,8503,' +
  '8569,8634,8698,8761,8824,8885';

export const POP_FIRST_YEAR = 1950;
export const POP_LAST_ESTIMATE_YEAR = 2023;
const POP = RAW.split(',').map(Number);

/** Population in millions for a year, or null when the table does not cover it. */
export function worldPopulation(year: number): number | null {
  const v = POP[year - POP_FIRST_YEAR];
  return v == null || year < POP_FIRST_YEAR ? null : v;
}

/** NASA Moon Fact Sheet: synodic period 29.53 days (new moon to new moon). */
export const SYNODIC_DAYS = 29.530589;
/** NASA Earth Fact Sheet: mean orbital velocity 29.78 km/s. */
export const ORBIT_KM_PER_S = 29.78;
/** Johns Hopkins Medicine: a healthy adult's resting pulse is 60–100 beats per minute. */
export const HEART_LOW = 60;
export const HEART_HIGH = 100;
/** Johns Hopkins Medicine: an adult at rest takes 12–16 breaths per minute. */
export const BREATH_LOW = 12;
export const BREATH_HIGH = 16;
