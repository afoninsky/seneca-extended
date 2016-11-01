const Promise = require('bluebird')

const route = {
  echo: { role: 'debug', cmd: 'echo' },
  error: { role: 'debug', cmd: 'error' },
  errorInternal: { role: 'debug', cmd: 'error-internal' },
  errorPayloaded: { role: 'debug', cmd: 'error-payload' },
  errorTimeout: { role: 'debug', cmd: 'error-timeout' }
}

module.exports = {

  name: 'custom',

  routes: route,

  init: () => Promise.resolve(),

  seneca: function () {
    this.addAsync(route.echo, message => {
      return message
    })

    this.addAsync(route.errorTimeout, message => {
      return new Promise(() => {})
    })

    this.addAsync(route.errorPayloaded, message => {
      const err = new Error('custom payload')
      err.payload = { some: 'data' }
      err.name = 'custom'
      err.code = err.statusCode = 500
      throw err
    })

    this.add(route.error, (message, done) => {
      this.emitError(new Error('custom error'), done)
    })

    this.add(route.errorInternal, () => {
      badfunction()
    })
  }
}
