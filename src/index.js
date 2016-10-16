const pkg = require(`${process.env.PWD}/package`)
const { decorateSeneca, createSenecaLogger, loadPlugins } = require(`${__dirname}/utils`)

module.exports = (baseConfig = {}) => {

  const extendedConfig = {}
  const customLogger = require(`${__dirname}/logger`)({
    name: pkg.name,
    version: pkg.version,
    level: baseConfig.logLevel || 'debug'
  })

  // rewrite default seneca logger
  extendedConfig.internal = extendedConfig.internal || {}
  extendedConfig.internal.logger = createSenecaLogger(customLogger)

  const config = Object.assign({}, baseConfig, extendedConfig)
  const seneca = require('seneca')(config)

  // append additional methods (promisified actions, error emitters, clean loggers etc)
  const customSeneca = decorateSeneca(seneca, customLogger)
  // load plugins from userspace
  if (config.pluginsDir) {
    loadPlugins(seneca, config.pluginsDir, config)
  }
  return customSeneca
}
