import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { CATEGORY_KEYS, SITE_NAME } from '../config/site';

export const TITLE_SUFFIX = ` | ${SITE_NAME}`;

const noTodo = (s: string) => !/\bTODO\b/.test(s);
const text = (min = 1) => z.string().trim().min(min).refine(noTodo, 'Replace the TODO placeholder');

const games = defineCollection({
  loader: glob({ pattern: '*.md', base: './src/content/games' }),
  schema: z
    .object({
      slug: z
        .string()
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug must be lowercase and hyphenated'),
      title: text(),
      h1: text(),
      metaTitle: text(),
      metaDescription: text(),
      primaryKeyword: text(),
      secondaryKeywords: z.array(text()).min(3).max(8),
      category: z.enum(CATEGORY_KEYS),
      tags: z.array(text()).min(1),
      shortDescription: text().refine((s) => s.length < 90, 'shortDescription must be under 90 characters'),
      intro: text().refine((s) => s.length <= 200, 'intro must be one short line (200 chars max)'),
      faqs: z
        .array(z.object({ question: text(), answer: text() }))
        .min(4)
        .max(6),
      related: z.array(z.string()).optional().default([]),
      featured: z.boolean().optional().default(false),
      color: z.string().optional(),
      publishedAt: z.coerce.date(),
      updatedAt: z.coerce.date(),
      shareText: text().refine((s) => s.includes('{score}'), 'shareText must contain {score}'),
      thumbAlt: text(),
      // Reserved game area height in px, so nothing below the game shifts while it loads.
      stageHeight: z.number().int().min(300).max(6000).default(560),
      stageHeightMobile: z.number().int().min(300).max(9000).optional(),
    })
    .superRefine((d, ctx) => {
      const fullTitle = d.metaTitle + TITLE_SUFFIX;
      if (fullTitle.length < 50 || fullTitle.length > 60) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metaTitle'],
          message: `metaTitle with suffix must be 50-60 chars, got ${fullTitle.length}: "${fullTitle}"`,
        });
      }
      const plain = (s: string) =>
        s
          .toLowerCase()
          .replace(/['’]s\b/g, '')
          .replace(/['’]/g, '');
      const kw = plain(d.primaryKeyword);
      const kwAt = plain(d.metaTitle).indexOf(kw);
      if (kwAt === -1 || kwAt > 15) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metaTitle'],
          message: 'metaTitle must contain the primary keyword near the start',
        });
      }
      const len = d.metaDescription.length;
      if (len < 140 || len > 155) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metaDescription'],
          message: `metaDescription must be 140-155 chars, got ${len}`,
        });
      }
      if (!plain(d.metaDescription).includes(kw)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['metaDescription'],
          message: 'metaDescription must include the primary keyword',
        });
      }
      if (!plain(d.h1).includes(kw)) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['h1'], message: 'h1 must contain the primary keyword' });
      }
      const kwSlug = kw.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (d.slug !== kwSlug) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['slug'],
          message: `slug must match the primary keyword ("${kwSlug}")`,
        });
      }
      if (d.updatedAt < d.publishedAt) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['updatedAt'], message: 'updatedAt is before publishedAt' });
      }
    }),
});

export const collections = { games };
