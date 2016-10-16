const { test } = require('ava')
const logger = require(`${process.env.PWD}/src/logger`)
const { loadPlugins } = require(`${process.env.PWD}/src/utils`)

const seneca = require(`${process.env.PWD}/src`)({
  logLevel: 'info'
})

test.before(() => {
  return loadPlugins(seneca, `${process.env.PWD}/test/fixtures/plugins`)
})

test('promisified action', t => {
	return seneca.actAsync('role:debug,cmd:echo', { some: 'payload'}).then(res => {
		t.is(res.some, 'payload')
	})
})

test('handle custom error', t => {
	return seneca.actAsync('role:debug,cmd:error').catch(err => {
		t.is(err.message, 'custom error')
	})
})

test('handle unregistered action', t => {
	return seneca.actAsync('role:nosuchrole').catch(err => {
		t.regex(err.message, /No matching action pattern found/)
	})
})

test('handle internal error', t => {
	return seneca.actAsync('role:debug,cmd:error-internal').catch(err => {
		t.regex(err.message, /badfunction is not defined/)
	})
})

test('log something', t => {
  // mute stdout
  const write = process.stdout.write
  process.stdout.write = () => {}

	t.throws(() => {
		logger()
	})


  const log = logger({
    name: 'test',
  })
	log.debug('some message')
	log.debug(new Error('serialize me plzkthx'))
	log.debug({err: 'not a error'})
	process.stdout.write = write
})
