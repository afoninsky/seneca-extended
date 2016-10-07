// const config = require('config')
const { test } = require('ava')
const seneca = require(`${process.env.PWD}/src`)
const { requireDirectory } = require(`${process.env.PWD}/src/utils`)
const plugins = requireDirectory(`${process.env.PWD}/test/fixtures/plugins`)
const logger = require(`${process.env.PWD}/src/logger`)

for (let name in plugins) {
	seneca.use(plugins[name])
}

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
//
// test('ensure healthcheck is working', t => {
//   return request.get('/_ah/health').then(res => {
//     t.is(res.data.name, pkg.name)
//   })
// })

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
