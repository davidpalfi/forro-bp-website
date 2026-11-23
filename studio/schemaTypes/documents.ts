// The documents the admin edits. Field names match the site's content model
// (src/lib/sanity/model.ts); change both together. See docs/SPEC.md, section 11.
import { defineField, defineType } from 'sanity'
import { pageBlockMembers } from './blocks'
import { linkRule, localizedFields } from './shared'

const homeBlocks = (title: string) =>
  defineField({
    name: 'homeBlocks',
    title,
    description: 'Shown under the big banner. Add, remove and drag blocks to reorder them.',
    type: 'array',
    of: pageBlockMembers,
  })

/* ---------- Site settings ---------- */

const tagline = localizedFields('tagline', 'Short description', 'text', 'Shown by search engines and in link previews.')
const footerNote = localizedFields('footerNote', 'Footer note (optional)', 'text')

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fieldsets: [tagline.fieldset, footerNote.fieldset],
  fields: [
    defineField({ name: 'name', title: 'Community name', type: 'string' }),
    defineField({
      name: 'defaultLang',
      title: 'Main language',
      description: 'For visitors whose browser is in neither language.',
      type: 'string',
      options: { list: [{ title: 'English', value: 'en' }, { title: 'Magyar', value: 'hu' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'en',
    }),
    ...tagline.fields,
    defineField({ name: 'email', title: 'Contact email', type: 'string' }),
    defineField({ name: 'instagram', title: 'Instagram address', type: 'url' }),
    defineField({ name: 'facebook', title: 'Facebook address', type: 'url' }),
    ...footerNote.fields,
    defineField({
      name: 'noindex',
      title: 'Hide the site from Google',
      description: 'Keep this on until the site is launched.',
      type: 'boolean',
      initialValue: true,
    }),
  ],
  preview: { prepare: () => ({ title: 'Site settings' }) },
})

/* ---------- Community home ---------- */

const communityTitle = localizedFields('title', 'Title on the banner')

const communitySettings = defineType({
  name: 'communitySettings',
  title: 'Community home page',
  type: 'document',
  fieldsets: [communityTitle.fieldset],
  fields: [
    ...communityTitle.fields,
    defineField({ name: 'heroImage', title: 'Banner photo', type: 'imageWithAlt' }),
    homeBlocks('Home page blocks'),
  ],
  preview: { prepare: () => ({ title: 'Community home page' }) },
})

/* ---------- Festival ---------- */

const dateLine = localizedFields('dateLine', 'Dates', 'string', 'Shown on the banner and in the header, e.g. "19-21 June 2026".')
const ticketLabel = localizedFields('ticketLabel', 'Ticket button text')
const festivalTagline = localizedFields('tagline', 'Short description', 'text', 'Shown by search engines and in link previews.')

const festivalSettings = defineType({
  name: 'festivalSettings',
  title: 'Festival home page',
  type: 'document',
  groups: [
    { name: 'banner', title: 'Banner and tickets', default: true },
    { name: 'blocks', title: 'Page content' },
  ],
  fieldsets: [dateLine.fieldset, ticketLabel.fieldset, festivalTagline.fieldset],
  fields: [
    defineField({ name: 'name', title: 'Festival name', type: 'string', group: 'banner' }),
    defineField({ name: 'logo', title: 'Big logo (banner)', description: 'The large logo in the middle of the banner, shown instead of the name. A PNG with a transparent background works best.', type: 'image', group: 'banner' }),
    defineField({ name: 'headerLogo', title: 'Small logo (top bar)', description: 'The small logo in the top-left corner of every festival page. Without it, the big logo is used there.', type: 'image', group: 'banner' }),
    defineField({ name: 'heroImage', title: 'Banner photo', type: 'imageWithAlt', group: 'banner' }),
    defineField({
      name: 'heroImagePhone',
      title: 'Banner photo for phones (optional)',
      description: 'A taller photo for narrow screens. Without it, phones show the banner photo above.',
      type: 'imageWithAlt',
      group: 'banner',
    }),
    ...dateLine.fields.map((f) => ({ ...f, group: 'banner' })),
    defineField({ name: 'ticketUrl', title: 'Ticket shop address', type: 'string', validation: (rule) => rule.custom(linkRule), group: 'banner' }),
    ...ticketLabel.fields.map((f) => ({ ...f, group: 'banner' })),
    defineField({ name: 'instagram', title: 'Festival Instagram address', type: 'url', group: 'banner' }),
    ...festivalTagline.fields.map((f) => ({ ...f, group: 'banner' })),
    { ...homeBlocks('Festival home page blocks'), group: 'blocks' },
  ],
  preview: { prepare: () => ({ title: 'Festival home page' }) },
})

/* ---------- Pages ---------- */

const pageTitle = localizedFields('title', 'Page name', 'string', 'Used in the menu and the browser tab.')
const pageHeading = localizedFields('heading', 'Big heading (optional)', 'string', 'Shown at the top of the page. Without it, the page name is shown.')
const menuLabel = localizedFields('menuLabel', 'Menu label (optional)', 'string', 'A shorter word for the menu. Without it, the page name is used.')
const description = localizedFields('description', 'Short description (optional)', 'text', 'Shown by search engines and in link previews.')

/** Addresses the site already uses; a page cannot take them. */
export const RESERVED_SLUGS: Record<string, string[]> = { festival: [], community: ['festival'] }

const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: [
    { name: 'content', title: 'Content', default: true },
    { name: 'settings', title: 'Settings' },
  ],
  fieldsets: [pageTitle.fieldset, pageHeading.fieldset, menuLabel.fieldset, description.fieldset],
  fields: [
    ...pageTitle.fields.map((f) => ({ ...f, group: ['content', 'settings'] })),
    ...pageHeading.fields.map((f) => ({ ...f, group: 'content' })),
    defineField({
      name: 'coverImage',
      title: 'Photo above the page (optional)',
      type: 'imageWithAlt',
      group: 'content',
    }),
    defineField({ name: 'blocks', title: 'Page content', description: 'Add, remove and drag blocks to reorder them.', type: 'array', of: pageBlockMembers, group: 'content' }),
    defineField({
      name: 'slug',
      title: 'Address',
      description: 'The last part of the page address, e.g. "location" gives /en/festival/location/. Lowercase letters, numbers and hyphens. Changing it breaks links people saved.',
      type: 'slug',
      options: {
        source: 'title_en',
        maxLength: 60,
        slugify: (input: string) =>
          input
            .normalize('NFD')
            .replace(/[̀-ͯ]/g, '')
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '')
            .slice(0, 60),
      },
      group: 'settings',
      validation: (rule) =>
        rule.required().custom((value, context) => {
          const s = (value as { current?: string } | undefined)?.current ?? ''
          if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(s)) return 'Use lowercase letters, numbers and hyphens only'
          const section = (context.document as { section?: string } | undefined)?.section ?? 'festival'
          if ((RESERVED_SLUGS[section] ?? []).includes(s)) return `"${s}" is already used by the site`
          return true
        }),
    }),
    defineField({
      name: 'section',
      title: 'Part of the site',
      type: 'string',
      options: { list: [{ title: 'Festival', value: 'festival' }, { title: 'Community', value: 'community' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'festival',
      group: 'settings',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tone',
      title: 'Page colour',
      type: 'string',
      options: { list: [{ title: 'Red', value: 'red' }, { title: 'Cream', value: 'cream' }, { title: 'Dark', value: 'dark' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'red',
      group: 'settings',
    }),
    defineField({ name: 'showInMenu', title: 'Show in the menu', type: 'boolean', initialValue: true, group: 'settings' }),
    defineField({ name: 'order', title: 'Menu order', description: 'Smaller numbers come first.', type: 'number', initialValue: 50, group: 'settings' }),
    ...menuLabel.fields.map((f) => ({ ...f, group: 'settings' })),
    ...description.fields.map((f) => ({ ...f, group: 'settings' })),
  ],
  orderings: [{ title: 'Menu order', name: 'menuOrder', by: [{ field: 'section', direction: 'desc' }, { field: 'order', direction: 'asc' }] }],
  preview: {
    select: { en: 'title_en', hu: 'title_hu', slug: 'slug.current', section: 'section', media: 'coverImage' },
    prepare: ({ en, hu, slug, section, media }) => ({
      title: en || hu || 'Untitled page',
      subtitle: slug ? `/${section === 'community' ? '' : 'festival/'}${slug}/` : 'no address yet',
      media,
    }),
  },
})

/* ---------- People ---------- */

const role = localizedFields('role', 'Role (optional)', 'string', 'Shown above the name, e.g. "Dance Teacher".')
const bio = localizedFields('bio', 'Biography', 'text', 'Press Enter to start a new paragraph.')

const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fieldsets: [role.fieldset, bio.fieldset],
  fields: [
    defineField({ name: 'name', title: 'Name', type: 'string', validation: (rule) => rule.required() }),
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      options: { list: [{ title: 'Teacher', value: 'Teacher' }, { title: 'Artist', value: 'Artist' }], layout: 'radio', direction: 'horizontal' },
      initialValue: 'Teacher',
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'photo', title: 'Photo', type: 'imageWithAlt' }),
    ...role.fields,
    ...bio.fields,
    defineField({ name: 'instagram', title: 'Instagram address', type: 'url' }),
    defineField({ name: 'order', title: 'Display order', description: 'Smaller numbers come first.', type: 'number', initialValue: 50 }),
  ],
  orderings: [{ title: 'Display order', name: 'displayOrder', by: [{ field: 'group', direction: 'desc' }, { field: 'order', direction: 'asc' }] }],
  preview: {
    select: { title: 'name', subtitle: 'group', media: 'photo', order: 'order' },
    prepare: ({ title: t, subtitle, media }) => ({ title: t || 'Unnamed person', subtitle, media }),
  },
})

export const SINGLETONS = ['siteSettings', 'communitySettings', 'festivalSettings']

export const documentTypes = [siteSettings, communitySettings, festivalSettings, page, person]
