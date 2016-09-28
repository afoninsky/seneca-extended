global.Promise = require('bluebird')
const config = require('config')
const Logger = require('./logger')
const { decorateSeneca, createSenecaLogger } = require('./utils')

const pkg = require(`${process.env.PWD}/package`)

// create custom logger
const log = new Logger(config.log, pkg)
const seneca = require('seneca')({
  internal: {
    logger: createSenecaLogger(log)
  }
})

// append additional methods
const customSeneca = decorateSeneca(seneca, log)

module.exports = customSeneca
