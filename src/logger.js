/**
  application logger, support logging to console and remote logging service
  based on https://www.npmjs.com/package/bunyan
*/
const bunyan = require('bunyan')
const ld = require('lodash')

function serializeError(err) {
	if (!err || !err.stack) {
		return err
	}
  const resError = ld.pick(err, ['name', 'code', 'message'])
  resError.stack = err.stack.split('\n').slice(0, 6).join('\n')
  return resError
}

const serializers = { err: serializeError }
module.exports = config => bunyan.createLogger(Object.assign({}, config, { serializers }))
