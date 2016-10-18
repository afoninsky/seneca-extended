module.exports = function () {

    this.add({ role: 'debug', cmd: 'test' }, (message, done) => {
      done()
    })

}
