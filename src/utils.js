const Promise = require('bluebird')
const ld = require('lodash')
const fs = require('fs')
const path = require('path')

module.exports = {

/**
 * return object with modules in specified directory
 */
  requireDirectory(dir) {
    return fs.readdirSync(dir).map(name => path.basename(name, '.js')).reduce((accumulator, name) => {
      accumulator[name] = require(`${dir}/${name}`)
      return accumulator
    }, {})
  },

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
      const callback = data.pop()
      // emit error from data, temporal workaround:
      // https://github.com/senecajs/seneca/issues/523#issuecomment-245712042
      seneca.act(...data, (err, res) => {
        if (err) { return callback(err) }
        if (res.error) { return callback(new Error(res.error.message || 'Unknown microservice error')) }
        callback(null, res)
      })
    }

    // send stringified error to remote host
    const emitError = (error, callback) => {
      callback(null, {
        error: ld.pick(error, ['message', 'code', 'statusCode'])
      })
    }


    seneca.decorate('actAsync', Promise.promisify(act, {context: seneca}))
    seneca.decorate('emitError', emitError)
    seneca.decorate('logger', logger) // append clean logger without all seneca-specific stuff
    return seneca
  }
}
