global.Promise = require('bluebird')
const pkg = require(`${process.env.PWD}/package`)
const { decorateSeneca, createSenecaLogger } = require('./utils')

module.exports = (baseConfig = {}) => {

  const extendedConfig = {}
  const customLogger = baseConfig.customLogger || require('./logger')({
    name: pkg.name,
    version: pkg.version,
    level: baseConfig.logLevel || 'debug'
  })

  // rewrite default seneca logger
  extendedConfig.internal = extendedConfig.internal || {}
  extendedConfig.internal.logger = createSenecaLogger(customLogger)
  
  const config = Object.assign({}, baseConfig, extendedConfig)
  delete config.customLogger

  const seneca = require('seneca')(config)

  // append additional methods (promisified actions, error emitters, clean loggers etc)
  const customSeneca = decorateSeneca(seneca, customLogger)

  return customSeneca
}
