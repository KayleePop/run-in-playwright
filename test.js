const test = require('muggle-test')
const assert = require('muggle-assert')
const runInPlaywright = require('./run-in-playwright')
const playwright = require('playwright')

test('run and return string', async () => {
  const result = await runInPlaywright(() => {
    return 'penguin'
  })

  assert.equal(result, 'penguin', 'result should be returned correctly')
})

test('error from browser is thrown along with properties', async () => {
  // this code has to be duplicated because the closure is run in the browser
  const expectedError = new Error('penguin')
  expectedError.name = 'penguin'
  expectedError.lineNumber = 5
  expectedError.columnNumber = 5
  expectedError.stack = 'penguin'
  expectedError.fileName = 'penguin.png'

  await assert.rejects(
    runInPlaywright(async () => {
      const error = new Error('penguin')

      error.name = 'penguin'
      error.lineNumber = 5
      error.columnNumber = 5
      error.stack = 'penguin'
      error.fileName = 'penguin.png'

      throw error
    }),
    expectedError
  )
})

test('closure should be browserified', async () => {
  const result = await runInPlaywright(() => {
    return Buffer.from('penguin').toString()
  })

  assert.equal(result, Buffer.from('penguin').toString(), 'using Buffer in the closure should work')
})

test('async function closure should work', async () => {
  const result = await runInPlaywright(async () => {
    await new Promise(resolve => setTimeout(resolve, 100)) // wait 100ms

    return 'penguin'
  })

  assert.equal(result, 'penguin')
})

test('passing a playwright browser works', async () => {
  const browser = await playwright.firefox.launch()

  const userAgent = await runInPlaywright(() => {
    return window.navigator.userAgent
  }, browser)

  assert(userAgent.includes('Firefox'), 'user agent string should indicate firefox')

  await browser.close()
})

test('error is thrown on non-function closure', async () => {
  await assert.rejects(
    runInPlaywright(5),
    new Error('script must be a function')
  )
})
