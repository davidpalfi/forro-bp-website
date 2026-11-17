import { defineField, defineType } from 'sanity'
import { pageBlockMembers } from './blocks'
import { localizedFields } from './shared'

const communityName = localizedFields('name', 'Community name')
const tagline = localizedFields('tagline', 'Tagline', 'text')
const footerNote = localizedFields('footerNote', 'Footer note', 'text')
const communityTitle = localizedFields('title', 'Page title')
const communityIntro = localizedFields('intro', 'Introduction', 'text')
const festivalName = localizedFields('name', 'Festival name')
const dateLine = localizedFields('dateLine', 'Date line')
const ticketLabel = localizedFields('ticketLabel', 'Ticket button label')
const festivalTagline = localizedFields('tagline', 'Tagline', 'text')
const pageTitle = localizedFields('title', 'Page title')
const menuLabel = localizedFields('menuLabel', 'Menu label')
const description = localizedFields('description', 'Meta description', 'text')

const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fieldsets: [communityName.fieldset, tagline.fieldset, footerNote.fieldset],
  fields: [
    ...communityName.fields,
    defineField({
      name: 'defaultLang',
      title: 'Default language',
      type: 'string',
      options: { list: [{ title: 'English', value: 'en' }, { title: 'Hungarian', value: 'hu' }] },
      initialValue: 'hu',
    }),
    ...tagline.fields,
    defineField({ name: 'email', title: 'Contact email', type: 'string' }),
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
    defineField({ name: 'facebook', title: 'Facebook URL', type: 'url' }),
    ...footerNote.fields,
    defineField({ name: 'noindex', title: 'Hide from search engines', type: 'boolean', initialValue: true }),
  ],
})

const communitySettings = defineType({
  name: 'communitySettings',
  title: 'Community settings',
  type: 'document',
  fieldsets: [communityTitle.fieldset, communityIntro.fieldset],
  fields: [
    ...communityTitle.fields,
    defineField({ name: 'heroImage', title: 'Homepage image', type: 'imageWithAlt' }),
    ...communityIntro.fields,
    defineField({ name: 'homePage', title: 'Homepage content', type: 'reference', to: [{ type: 'page' }] }),
  ],
})

const festivalSettings = defineType({
  name: 'festivalSettings',
  title: 'Festival settings',
  type: 'document',
  fieldsets: [festivalName.fieldset, dateLine.fieldset, ticketLabel.fieldset, festivalTagline.fieldset],
  fields: [
    ...festivalName.fields,
    defineField({ name: 'logo', title: 'Festival logo', type: 'image' }),
    defineField({ name: 'heroImage', title: 'Festival homepage image', type: 'imageWithAlt' }),
    ...dateLine.fields,
    defineField({ name: 'ticketUrl', title: 'Ticket URL', type: 'url' }),
    ...ticketLabel.fields,
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
    ...festivalTagline.fields,
    defineField({ name: 'homePage', title: 'Festival homepage content', type: 'reference', to: [{ type: 'page' }] }),
    defineField({ name: 'programPage', title: 'Program page content', type: 'reference', to: [{ type: 'page' }] }),
  ],
})

const page = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  fieldsets: [pageTitle.fieldset, menuLabel.fieldset, description.fieldset],
  fields: [
    ...pageTitle.fields,
    defineField({
      name: 'slug',
      title: 'URL segment',
      type: 'slug',
      options: { source: 'title_en', maxLength: 80 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'section',
      title: 'Section',
      type: 'string',
      options: { list: [{ title: 'Community', value: 'community' }, { title: 'Festival', value: 'festival' }] },
      initialValue: 'festival',
      validation: (rule) => rule.required(),
    }),
    ...description.fields,
    ...menuLabel.fields,
    defineField({ name: 'showInMenu', title: 'Show in menu', type: 'boolean', initialValue: true }),
    defineField({ name: 'order', title: 'Menu order', type: 'number', initialValue: 100 }),
    defineField({ name: 'blocks', title: 'Page blocks', type: 'array', of: pageBlockMembers }),
  ],
  preview: {
    select: { title: 'title_en', subtitle: 'slug.current' },
    prepare: ({ title: previewTitle, subtitle }) => ({ title: previewTitle || 'Untitled page', subtitle }),
  },
})

const personName = localizedFields('name', 'Name')
const role = localizedFields('role', 'Role')
const bio = localizedFields('bio', 'Biography', 'text')

const person = defineType({
  name: 'person',
  title: 'Person',
  type: 'document',
  fieldsets: [personName.fieldset, role.fieldset, bio.fieldset],
  fields: [
    ...personName.fields,
    defineField({
      name: 'group',
      title: 'Group',
      type: 'string',
      options: { list: [{ title: 'Teacher', value: 'Teacher' }, { title: 'Artist', value: 'Artist' }] },
      validation: (rule) => rule.required(),
    }),
    defineField({ name: 'photo', title: 'Photo', type: 'imageWithAlt' }),
    ...role.fields,
    ...bio.fields,
    defineField({ name: 'instagram', title: 'Instagram URL', type: 'url' }),
    defineField({ name: 'order', title: 'Display order', type: 'number', initialValue: 100 }),
  ],
  preview: {
    select: { title: 'name_en', subtitle: 'group', media: 'photo' },
    prepare: ({ title: previewTitle, subtitle, media }) => ({
      title: previewTitle || 'Unnamed person',
      subtitle,
      media,
    }),
  },
})

export const documentTypes = [siteSettings, communitySettings, festivalSettings, page, person]