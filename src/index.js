global.Promise = require('bluebird')
const config = require('config')
const pkg = require(`${process.env.PWD}/package`)

const log = require('./logger')({
  name: pkg.name,
  version: pkg.version,
  level: config.logLevel
})

const { decorateSeneca, createSenecaLogger } = require('./utils')

// create custom logger
const seneca = require('seneca')({
  internal: {
    logger: createSenecaLogger(log)
  }
})

// append additional methods
const customSeneca = decorateSeneca(seneca, log)

module.exports = customSeneca
