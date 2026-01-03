// /**
//  * Incredible shit going on here
//  *
//  * This website template that I grabbed of the internettes uses a package called "contentlayer" which is not kept up-to-date.
//  * Apparently the way that thing works is that it does code generation.
//  * In a really brilliant turn of events, the ESM world introduced import/assert, then changed their minds and made it import/with
//  * ...and the code generator in contentlayer was never updated.
//  *
//  * The simplest solution is, god help me, to modify the contentlayer code-generator's sourcecode post install
//  */

// import fs from 'node:fs'
// import path from 'node:path'
// import { fileURLToPath } from 'url'

// const __dirname = path.dirname(fileURLToPath(import.meta.url))
// const generateDotpkgJsPath = path.join(
//   __dirname,
//   '..',
//   'node_modules',
//   '@contentlayer',
//   'core',
//   'dist',
//   'generation',
//   'generate-dotpkg.js'
// )
// let source = fs.readFileSync(generateDotpkgJsPath, 'utf8')
// source = source.replace(
//   "needsJsonAssertStatement ? ` assert { type: 'json' }` : ''",
//   "needsJsonAssertStatement ? ` with { type: 'json' }` : ''"
// )
// fs.writeFileSync(generateDotpkgJsPath, source, 'utf8')
