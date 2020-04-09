const browserify = require('browserify')
const tempy = require('tempy')
const playwright = require('playwright')

module.exports = async function runInPlaywright (script, playwrightBrowser) {
  if (typeof script !== 'function') {
    throw new Error('script must be a function')
  }

  const browser = playwrightBrowser || await playwright.chromium.launch()
  const page = await browser.newPage()

  try {
    const deffered = {}
    deffered.promise = new Promise((resolve, reject) => {
      deffered.resolve = resolve
      deffered.reject = reject
    })

    await page.exposeFunction('resolveRunInBrowser', deffered.resolve)
    await page.exposeFunction('rejectRunInBrowser', (plainError) => {
      // Error objects can't be passed from the browser back to node
      const error = new Error(plainError.message)
      error.name = plainError.name
      error.stack = plainError.stack
      error.lineNumber = plainError.lineNumber
      error.columnNumber = plainError.columnNumber
      error.fileName = plainError.fileName

      deffered.reject(error)
    })

    // store the script as a temporary file because browserify requires a file
    const tempFilePath = await tempy.write(`
      main()  
      async function main () {
        try {
          const result = await (${script.toString()})()

          window.resolveRunInBrowser(result)
        } catch (error) {
          window.rejectRunInBrowser({
            name: error.name,
            message: error.message,
            lineNumber: error.lineNumber,
            columnNumber: error.columnNumber,
            fileName: error.fileName,
            stack: error.stack
          })
        }
      }
    `)
    const browserifiedScript = await new Promise((resolve, reject) => {
      browserify(tempFilePath)
        .bundle((err, src) => {
          if (err) reject(err)

          resolve(src.toString())
        })
    })

    // ensure the deffered isn't rejected before being handled
    await Promise.all([
      page.addScriptTag({ content: browserifiedScript }),
      deffered.promise
    ])

    return deffered.promise
  } finally {
    await page.close()

    // don't close the browser if it was passed in
    if (!playwrightBrowser) {
      await browser.close()
    }
  }
}
