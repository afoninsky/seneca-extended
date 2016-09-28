// const config = require('config')
const { test } = require('ava')
const { requireDirectory } = require(`${process.env.PWD}/src/utils`)

test('require plugins', t => {
	const plugins = requireDirectory(`${process.env.PWD}/test/fixtures/plugins`)
	const pluginNames = Object.keys(plugins)
	t.deepEqual(pluginNames, ['test'])
})
