const Koa = require('koa')
const ld = require('lodash')

const info = Object.assign(ld.pick(require('../package'), ['name', 'version']), {
  NODE_ENV: process.env.NODE_ENV
})

const app = new Koa()

app.use(ctx => {
  const { method, url } = ctx
  if (method !== 'GET') { return }

  switch (url) {
    case '/_ah/health':
      ctx.body = info
  }
})

module.exports = app
