import { spawn } from 'child_process'
import { resolve } from 'path'

// Load the real source with production signal handlers; replace only the network transport.
const script = `
const ts = require('typescript')
const fs = require('fs')
require.extensions['.ts'] = (module, filename) => module._compile(
  ts.transpileModule(fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true }
  }).outputText, filename)
const { Writable } = require('stream')
let flushes = 0
const transport = new Writable({ write(chunk, encoding, callback) { callback() } })
transport.flush = async () => { flushes++ }
const transportPath = require.resolve('./src/lib/elastic-transport.ts')
require.cache[transportPath] = { exports: { createElasticTransport: () => transport } }
const Logger = require('./src/lib/logger.ts').default
if (process.env.MODE === 'before') Logger.disableAutomaticShutdown()
const logger = new Logger('shutdown-test')
if (process.env.MODE === 'after') Logger.disableAutomaticShutdown()
process.on('SIGTERM', () => {
  process.send('draining')
  setTimeout(async () => {
    logger.info('TEST', 'Worker drained')
    await Promise.all([Logger.close(), Logger.close()])
    process.send({ drained: true, flushes, ended: transport.writableFinished })
    process.exit(0)
  }, 150)
})
setInterval(() => {}, 1000)
process.send('ready')
`

describe('production logger shutdown ownership', () => {
	test.each(['before', 'after', 'automatic'])(
		'%s logger initialization',
		async (mode) => {
			const child = spawn(process.execPath, ['-e', script], {
				cwd: resolve(__dirname, '../..'),
				env: {
					...process.env,
					NODE_ENV: 'production',
					MODE: mode,
					ELASTICSEARCH_NODE: 'http://localhost:9200',
					ELASTICSEARCH_USERNAME: 'test',
					ELASTICSEARCH_PASSWORD: 'test',
					SERVER_NICKNAME: 'test',
				},
				stdio: ['ignore', 'pipe', 'pipe', 'ipc'],
			})
			const messages: unknown[] = []
			let stderr = ''
			child.stderr!.on('data', (chunk) => {
				stderr += chunk
			})
			const timeout = setTimeout(() => child.kill('SIGKILL'), 8000)
			try {
				const result = await new Promise((resolve, reject) => {
					child.on('error', reject)
					child.on('message', (message) => {
						messages.push(message)
						if (message === 'ready') child.kill('SIGTERM')
					})
					child.on('exit', (code, signal) => resolve({ code, signal }))
				})
				expect(stderr).toBe('')
				expect(result).toEqual({ code: 0, signal: null })
				if (mode === 'automatic') {
					expect(messages).not.toContainEqual(
						expect.objectContaining({ drained: true })
					)
				} else {
					expect(messages).toContainEqual({
						drained: true,
						flushes: 1,
						ended: true,
					})
				}
			} finally {
				clearTimeout(timeout)
				if (child.exitCode === null) child.kill('SIGKILL')
			}
		},
		10000
	)
})
