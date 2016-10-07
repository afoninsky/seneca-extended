global.Promise = require('bluebird')
const pkg = require(`${process.env.PWD}/package`)
const { decorateSeneca, createSenecaLogger } = require('./utils')

module.exports = (baseConfig = {}) => {

  const extendedConfig = {}

  // create custom logger
  baseConfig.internal = baseConfig.internal || {}
  if (!baseConfig.internal.logger) {
    extendedConfig.internal = extendedConfig.internal || {}
    const log = require('./logger')({
      name: pkg.name,
      version: pkg.version,
      level: baseConfig.logLevel || 'debug'
    })
    extendedConfig.internal.logger = createSenecaLogger(log)
  }

  const config = Object.assign({}, baseConfig, extendedConfig)
  const seneca = require('seneca')(config)

  // append additional methods (promisified actions, error emitters, clean loggers etc)
  const customSeneca = decorateSeneca(seneca, config.internal.logger)

  return customSeneca
}
