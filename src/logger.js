/**
  application logger, support logging to console and remote logging service
  based on https://www.npmjs.com/package/bunyan
*/
const bunyan = require('bunyan')
const { serializeError } = require('./utils')

const serializers = { err: serializeError }
module.exports = config => bunyan.createLogger(Object.assign({}, config, { serializers }))
