const Promise = require('bluebird')
const ld = require('lodash')

/**
 * simple error serializer/deserializer
 * things to improve:
 * - pull error (instead new stack will be created on `new`)
 * - handle .toJSON behaviour
 * - handle circular links
 * - check if buffer passed instead of json
 */
function serializeError(err) {
  if (err instanceof Error) {
    const resError = ld.pick(err, ['name', 'code', 'message', 'statusCode', 'payload'])
    resError.stack = err.stack.split('\n').slice(0, 6).join('\n')
    return resError
  }
  return err
}

function deserializeError(obj) {
  const err = new Error(obj.message)
  for(let name in obj) {
    err[name] = obj[name]
  }
  return err
}

const logLevels = { trace: 10, debug: 20, info: 30, warn: 40, error: 50, fatal: 60 }

module.exports = {

  serializeError, deserializeError,


/**
 * replace default senecajs logger with custom
 */
  createSenecaLogger(customLogger, logLevel) {
		// https://github.com/senecajs/seneca/blob/master/docs/examples/custom-logger.js
		function SenecaLogger () {}
    const tresholdLevel = logLevels[logLevel]
		SenecaLogger.preload = function () {
			return {
				extend: {
					logger: (context, payload) => {
            // 2do: ignore bunyan logger for now
            // 2do: decrease verbosity
            const currentLogLevel = logLevels[payload.level || 'debug']
            if (currentLogLevel < tresholdLevel) { return }
            // customLogger[payload.level](payload)
            switch (payload.level) {
              case 'warn':
              case 'error':
                console.error(payload)
                break
              case 'info':
              case 'debug':
              default:
                console.log(payload)
            }
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

    // extended version of .act with some sugar and error catching
    const act = (...data) => {
      const callback = typeof data[data.length - 1] === 'function' ? data.pop() : ld.noop

      // remove from route parguments passed as payload
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

    // extended verison of .use with ability to init plugins before load
    const useAsync = (input, options, name) => {
      const plugin = typeof input === 'string' ? require(input) : input

      // core functionality
      if (ld.isFunction(plugin)) {
        seneca.use(plugin, options)
        return Promise.resolve()
      }

      // extended plugin (with possible .init and .routes)
      if (!plugin.seneca) {
        return Promise.reject(new Error('not a seneca plugin'))
      }
      return (plugin.init || Promise.resolve)(seneca, options).then(() => {
        seneca.use(plugin.seneca, options)
        if (name && plugin.routes) {
          seneca.routes[name] = Object.assign({}, plugin.routes)
        }
      })

    }

    seneca.decorate('routes', {})
    seneca.decorate('useAsync', useAsync)
    seneca.decorate('actCustom', act)
    seneca.decorate('actAsync', Promise.promisify(act, {context: seneca}))
    seneca.decorate('emitError', emitError)
    seneca.decorate('logger', logger) // append clean logger without all seneca-specific stuff
    return seneca
  }
}
