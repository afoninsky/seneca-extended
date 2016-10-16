const config = require('config')
const opbeat = require('opbeat')

const cfg = Object.assign({}, config.opbeat, {
  active: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'staging',
  instrument: false // dont log requests
})

opbeat.addFilter(payload => {
  payload.extra.env = process.env.NODE_ENV
  return payload
})

module.exports = opbeat.start(cfg)
