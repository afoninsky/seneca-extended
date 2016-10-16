const route = {
  echo: { role: 'debug', cmd: 'echo' },
  error: { role: 'debug', cmd: 'error' },
  errorInternal: { role: 'debug', cmd: 'error-internal' }
}

module.exports = {

  seneca: function () {
    this.add(route.echo, (message, done) => {
      done(null, message)
    })

    this.add(route.error, (message, done) => {
      this.emitError(new Error('custom error'), done)
    })

    this.add(route.errorInternal, () => {
      badfunction()
    })
  }
}
