/*
 * Worker thread for the "app callsites" test in
 * __tests__/babel-plugin-lexicon-leaf-imports.test.js: typechecks the
 * consumer files with the given overlay contents and reports error
 * diagnostics. The baseline and shadow typechecks are independent CPU-bound
 * programs, so the test runs one worker for each in parallel.
 *
 * Lives outside __tests__/ so Jest does not collect it as a test suite.
 * ts.Diagnostic objects do not survive structured clone, so diagnostics are
 * flattened to plain {code, message, fileName, line} records here.
 */
const {parentPort, workerData} = require('node:worker_threads')
const ts = require('typescript')

const {consumers, overlays, options} = workerData

const host = ts.createCompilerHost(options)
const origGetSourceFile = host.getSourceFile.bind(host)
const origFileExists = host.fileExists.bind(host)
const origReadFile = host.readFile.bind(host)
host.fileExists = f => overlays.has(f) || origFileExists(f)
host.readFile = f => overlays.get(f) ?? origReadFile(f)
host.getSourceFile = (f, lang, ...rest) =>
  overlays.has(f)
    ? ts.createSourceFile(f, overlays.get(f), lang)
    : origGetSourceFile(f, lang, ...rest)

const program = ts.createProgram(consumers, options, host)
const byFile = {}
for (const file of consumers) {
  const sf = program.getSourceFile(file)
  if (!sf) throw new Error(`${file} missing from program`)
  byFile[file] = [
    ...program.getSyntacticDiagnostics(sf),
    ...program.getSemanticDiagnostics(sf),
  ]
    .filter(d => d.category === ts.DiagnosticCategory.Error)
    .map(d => ({
      code: d.code,
      message: ts.flattenDiagnosticMessageText(d.messageText, ' '),
      fileName: d.file?.fileName,
      line:
        d.file && d.start !== undefined
          ? d.file.getLineAndCharacterOfPosition(d.start).line + 1
          : undefined,
    }))
}
parentPort.postMessage(byFile)
