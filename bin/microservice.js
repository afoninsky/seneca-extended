#!/usr/bin/env node

/**
 * Basic microservice launcher sample
 */

if (module.parent) { throw new Error('Im not a module, please launch me directly. Thank you') }

const config = require('config')
const seneca = require('../src')()
const { loadPlugins } = require('../utils')

const requirePath = config.pluginsPath || `${process.cwd()}/src/seneca`
loadPlugins(seneca, requirePath, config).then(loaded => {
  // run http transport
  seneca.listen(config.listen)
  // run healthcheck server
  if (config.health && config.health.port) {
    require('../src/health').listen(config.health.port)
  }
  seneca.logger.info(`Services started: ${loaded.join(', ')}`)
})
