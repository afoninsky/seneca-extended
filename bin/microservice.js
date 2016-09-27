#!/usr/bin/env node

if (module.parent) { throw new Error('Im not a module, please launch me directly. Thank you') }

const config = require('config')
const seneca = require('../src')
const { requireDirectory } = require('../src/utils')

const plugins = requireDirectory(`${process.cwd()}/src`)
const services = process.argv.length > 2 ? process.argv.slice(2) : Object.keys(plugins)

services.forEach(name => {
  if (!plugins[name]) { throw new Error(`Cant find plugin: ${name}`) }
  seneca.use(plugins[name], config[name])
})

seneca.logger.info(`Services started: ${services.join(', ')}`)
seneca.listen(config.listen)
