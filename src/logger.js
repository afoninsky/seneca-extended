/**
  application logger, support logging to console and remote logging service
  based on https://www.npmjs.com/package/bunyan
*/
const bunyan = require('bunyan')
const logstash = require('bunyan-logstash')
const ld = require('lodash')

function serializeError(err) {
	if (!err || !err.stack) {
		return err
	}
  const resError = ld.pick(err, ['name', 'code', 'message'])
  resError.stack = err.stack.split('\n').slice(0, 6).join('\n')
  return resError
}

function serializeResponse(res) {
  const headers = res.header || res.headers
  const ret = {
    id: headers['x-request-id'],
    status: res.status,
    time: parseInt(headers['x-response-time'], 10)
  }
  if (process.env.NODE_ENV !== 'production') {
    ret.body = res.body
  }
  return ret
}

function serializeRequest(req) {
  const ret = ld.pick(req, ['method', 'url', 'headers'])
  if (req.user) {
    ret.userId = req.user._id
  }
  return ret
}

function streamsFromConfig(cfg) {
  const streams = []
	ld.each(cfg, (opt, name) => {
		switch (name) {
			case 'stdout':
				streams.push(ld.defaults(opt, {
					level: 'debug',
					stream: process.stdout
				}))
				break
      case 'logstash':
				streams.push(ld.defaults(opt, {
					level: 'debug',
					type: 'raw',
					stream: logstash.createStream(opt)
				}))
        break
			default:
				throw new Error(`option ${name} not supported`)
		}
	})
	return streams
}

class Logger {

  constructor(config, pkg, customSerializers) {

    const serializers = Object.assign({}, {
      err: serializeError,
      req: serializeRequest,
      res: serializeResponse
    }, customSerializers)
    const tags = ['nodejs', process.env.NODE_ENV || 'development']
    const streams = streamsFromConfig(config)

		const cfg = this.cfg = ld.extend(
      { tags, streams, serializers},
      ld.pick(pkg, ['version', 'name'])
    )
    return bunyan.createLogger(cfg)
	}
}

module.exports = Logger
module.exports.serializeError = serializeError
