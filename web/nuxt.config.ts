// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },
  
  // Development server config
  devServer: {
    port: 3001,
  },
  
  // Runtime config for API
  runtimeConfig: {
    public: {
      apiBase: 'http://localhost:3000/api',
    },
  },
  
  // CSS
  css: ['~/assets/css/main.css'],
  
  // App config
  app: {
    head: {
      title: 'Mini Jira',
      meta: [
        { name: 'description', content: 'A minimal Jira clone' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
      ],
    },
  },
  
  // Future compatibility
  future: {
    compatibilityVersion: 4,
  },
});
