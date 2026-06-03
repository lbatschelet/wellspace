import { brand } from '@brand/config.js'
import { render404 } from './app/notFound.js'

const adminBase = String(brand?.adminBase || '/admin/')

render404({
  mount: document.querySelector('#app'),
  brand,
  homeHref: adminBase,
  copy: {
    de: {
      title: 'Diese Admin-Seite gibt es nicht.',
      body: 'Die angeforderte Seite wurde nicht gefunden. Vielleicht wurde sie verschoben oder existiert nicht mehr.',
      home: 'Zum Dashboard',
    },
    en: {
      title: 'This admin page does not exist.',
      body: 'The page you requested could not be found. It may have moved or no longer exists.',
      home: 'Back to dashboard',
    },
  },
})
