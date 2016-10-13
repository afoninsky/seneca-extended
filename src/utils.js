const Promise = require('bluebird')
const ld = require('lodash')
const fs = require('fs')
const path = require('path')

/**
 * simple error serializer/deserializer
 * things to improve:
 * - pull error (instead new stack will be created on `new`)
 * - handle .toJSON behaviour
 * - handle circular links
 * - check if buffer passed instead of json
 */
function serializeError(err) {
  const resError = ld.pick(err, ['name', 'code', 'message', 'statusCode', 'payload'])
  resError.stack = err.stack.split('\n').slice(0, 6).join('\n')
  return resError
}

function deserializeError(obj) {
  const err = new Error(obj.message)
  for(let name in obj) {
    err[name] = obj[name]
  }
  return err
}

module.exports = {

  serializeError, deserializeError,

/**
 * return object with modules in specified directory
 */
  requireDirectory(dir, onlyFunctions = true) {
    return fs.readdirSync(dir).map(name => path.basename(name, '.js')).reduce((accumulator, name) => {
      const obj = require(`${dir}/${name}`)
      if (!onlyFunctions || obj instanceof Function) {
        accumulator[name] = obj
      }
      return accumulator
    }, {})
  },

/**
 *
 */

/**
 * replace default senecajs logger with custom
 */
  createSenecaLogger(customLogger) {
		// https://github.com/senecajs/seneca/blob/master/docs/examples/custom-logger.js
		function SenecaLogger () {}
		SenecaLogger.preload = function () {
			return {
				extend: {
					logger: (context, payload) => {
// [ 'actid', 'msg', 'entry', 'prior', 'gate', 'caller', 'meta', 'client','listen', 'transport', 'kind', 'case',
// 'duration', 'result', 'level', 'plugin_name', 'plugin_tag', 'pattern', 'seneca', 'when' ]
						customLogger[payload.level](payload)
					}
				}
			}
		}
		return SenecaLogger
	},

/**
 * append additional methods into seneca instanse: promisifed actions, common error emitter etc
 */
  decorateSeneca(seneca, logger) {
    const act = (...data) => {
      const callback = typeof data[data.length - 1] === 'function' ? data.pop() : ld.noop

      // sugar stuff: remove from route arguments passed as payload
      if (data.length > 1) {
        const payload = data[data.length - 1]
        if (ld.isPlainObject(data[0]) && ld.isPlainObject(payload)) {
          data[0] = ld.omit(data[0], Object.keys(payload))
        }
      }

      // emit error from data, temporal workaround:
      // https://github.com/senecajs/seneca/issues/523#issuecomment-245712042
      seneca.act(...data, (err, res) => {
        if (err) { return callback(err) }
        // 2do: !!! find how to pass additional error fields to seneca error (ex: .payload is not passed)
        if (res && res.error) { return callback(deserializeError(res.error)) }
        callback(null, res)
      })
    }

    // send stringified error to remote host
    const emitError = (error, callback) => {
      callback(null, {
        error: serializeError(error)
      })
    }


    seneca.decorate('actAsync', Promise.promisify(act, {context: seneca}))
    seneca.decorate('actCustom', act)
    seneca.decorate('emitError', emitError)
    seneca.decorate('logger', logger) // append clean logger without all seneca-specific stuff
    return seneca
  }
}
