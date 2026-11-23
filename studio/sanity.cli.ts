import { defineCliConfig } from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '8hc671sk',
    dataset: 'production',
  },
  // The editor's address: https://forro-budapest.sanity.studio
  // If `npm run studio:deploy` says the name is taken, choose another here.
  studioHost: 'forro-budapest',
})
