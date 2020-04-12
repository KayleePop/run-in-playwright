# Run In Playwright

[![Node.js CI](https://github.com/KayleePop/run-in-playwright/workflows/Node.js%20CI/badge.svg)](https://github.com/KayleePop/run-in-playwright/actions)
[![standard badge](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![npm](https://img.shields.io/npm/v/run-in-playwright.svg)](https://www.npmjs.com/package/run-in-playwright)

Run a function in a clean browser environment using playwright and return the result. The function is automatically passed through browserify, so `require` can be used.

## Usage

``` js
const runInPlaywright = require('run-in-playwright')

test('window object should exist', async () => {
  // the function runs on a browser launched by playwright
  const isWindow = await runInPlaywright(() => {
    return !!window
  })

  assert(isWindow === true)
})

test('wait 1 second and return time', async () => {
  // async functions work!
  const time = await runInPlaywright(async () => {
    await new Promise(resolve => setTimeout(resolve, 1000))

    return new Date()
  })

  assert.equal(time, new Date())
})

// can use require in the function
test('sum() should work in browser', async () => {
  const sum = await runInPlaywright(async () => {
    // this is relative to CWD (where test.js file is executed)
    const sum = require('./sum.js')

    return sum(5, 5)
  })

  assert.equal(sum, 10)
})
```

## API

`async runInPlaywright(script, [playwrightBrowser])`

`script` is a function to be run in the browser environment. It it passed using `script.toString()`, so its scope is a browser script tag's (no scope is transfered from node). `require` and node builtins will work however, because the script is browserified before being sent to the browser. Require will be relative to `CWD` (the directory that the script is run from like `$ node index.js`). `script` is awaited, so both sync and async functions will work.

`playwrightBrowser` is a [playwright browser instance](https://github.com/microsoft/playwright/blob/master/docs/api.md#class-browser) to be used instead of creating a new headless chromium process. This allows control over the evironment the script is run on. `browser.newPage()` is called to run the script on, and that page will be closed once the script finishes execution, but a passed in browser instance will not be closed by `runInBrowser()`.

## Behavior

Errors thrown in the script will be passed back to the runInBrowser function, but Error instances cannot be transferred from the browser evironment back to node. Instead, the `name`, `message`, `fileName`, `lineNumber`, `columnNumber`, and `stack` properties are transferred and applied to a `new Error()` which is then thrown.

The script is saved to a temporary file using [tempy](https://www.npmjs.com/package/tempy) in order to be browserified (browserify only works on files not strings).

Every time runInPlaywright is executed, a new clean headless chromium process is launched. Multiple will be launched concurrently if runInBrowser is called multiple times without resolving.
