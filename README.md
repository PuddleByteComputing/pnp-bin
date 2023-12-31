# pnp-bin

This is a minimal equvalent to `yarn bin [command]`.

It was built to be used in an editor plugin (apheleia for emacs),
where responsiveness is at a premium.  Its only benefit over
`yarn bin` is execution time.

## Usage

```bash
yarn build
dist/pnp-bin.minimized.cjs </target/.pnp.cjs> [command]`
```

Where </target/.pnp.cjs> is the path to the `.pnp.cjs` file of your
plug-and-play project, and [command] is the name of the pnp package
binary you're looking for. If [command] is omitted, `pnp-bin` will
list the names of all binaries found. Otherwise, it provides the
location of the command provided, if found.

Note that the location (path to) a binary might not match the name of
the binary: e.g. the `prettier` package provides a binary named
'prettier' that points to a file named 'prettier.cjs'. The location
may or may not be a real filesystem path; it may point into a zip
archive.

To run a package bin (executable) once found, use

```bash
node --require <.pnp.cjs> [--loader <.pnp.loader.mjs>] <bin-location>`
```

The `loader` option is required for ESM packages, but not for commonjs
(if your package has a .pnp.loader.mjs, you probably need it).

The script dynamically loads the provided `.pnp.cjs`, which provides
the [pnp api](https://yarnpkg.com/advanced/pnpapi). This is then used
to locate the requested bin (executable).

## Performance

On a dev machine, this script took ~75ms vs. ~580ms for
`yarn bin <foo>`.

### Build

`yarn build` bundles a standalone pnp-bin.minified.cjs into dist/.
You can move/rename this file as needed, but must keep the .cjs
extension on the file.

## Library

pnp-bin exports an async constructor, PnpBin, which takes the full
path to the `.pnp.cjs` file of the project you're inspecting

```js
import { PnpBin } from "pnp-bin"

pnpBin = await PnpBin(targetPnpPath)

const binaries = pnpBin.listBinaries()
const binaryPath = pnpBin.findBinary('some-bin')
```

the resolved Promise is an object with two functions

### listBinaries()

Returns an array of two-element arrays; the first element is
the name of the bin, the second is the full path to it.

### findBinary(binName)

Returns the full path to the bin specified, if found.  This will
be a little quicker than doing a listBinaries() and then picking
your bin out of the list, because it stops looking into zip files
as soon as it finds a match, and also checks any package matching
binName first.
