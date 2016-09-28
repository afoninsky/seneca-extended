module.exports = function() {

  this.add('role:debug,cmd:echo', (message, done) => {
    done(null, message)
  })

  this.add('role:debug,cmd:error', (message, done) => {
    this.emitError(new Error('custom error'), done)
  })

  this.add('role:debug,cmd:error-internal', (message, done) => {
    badfunction()
  })

}
