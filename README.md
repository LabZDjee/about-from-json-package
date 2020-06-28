# Make an About JSON File from `package.json`

This package helps extract data from `package.json` and copy them to a JSON file which can be bundled by _Webpack_ and also manages a _build_ sequence (increased after each build)

## The Problem

It appears interesting to expose version, writer, dependencies, etc which are contained into `package.json` of an [Electron app](https://www.electronjs.org). For example: package, `env.npm_package_version` gives the project version and this information can be displayed in an _about_ box. However this only works in dev mode: when app is build this information is not defined anymore

The solution we found is to add a node _pre-process_ in `npm run build` (or equivalent) which creates a [JSON](https://www.json.org) file which will be part of the build and only takes _some_ information from `package.json`

This solution has the advantage this JSON file does not expose the entire information from `package.json` which can be a plus in case of a _Webapp_ bundled from source file or even not bundled at all

## What it Does

Package consists of `aboutFileFromPackageJson` function which takes the object read from a `package.json`, creates/rewrite a JSON file which contains parts of this `package.json`. This package also manages a `build` property in the exported object which is increased call after call to `aboutFileFromPackageJson`

Purpose is essentially to use this library as a preprocessor which updates this JSON file before the actual build

## The Output JSON File

This JSON file consists of two properties:

- `build`: a string that is based on date and a letter defining which build within the same day. See description below
- `packageJson`: sub-object that is extracted from the `package.json` file

## The `build` Property

This field is a string defined as the number of days since Wednesday, 2020/01/01, followed by a letter. This letter is defined as `0` to `9`, then `A` to `Z`, then `a` to `z` (10+26+26, i.e. 62 values). _Within the same day_, it is increased in this order if already found in the output ECMAScript file

Example: `"5623"`, means build was done on Wednesday, 2021/07/15, i.e. 562 days after 2020/01/01 and 3 means this is the fourth build _within_ that day. If instead of `"3"` we had `"b"`, it would mean 38th build (10+26+2)

In the unlikely case of more than 62 builds were made on the same day, we would have a dot '.' plus as many letters as needed. For example, `"562.3Af"`, means 12,194th build (62²x3 + 62x10 + 42) on the same day (Wednesday, 2021/07/15)

## Suggested Usage

The idea is to run a script which calls `aboutFileFromPackageJson` before calling the actual build script

One way to achieve this is to install [npm-run-all](https://www.npmjs.com/package/npm-run-all) package as _dev dependency_

Then in the `scripts` section of `package.json`, rename the normal build script (for example call it `actual-build`) and replace the normal build script with `run-s pre-run actual-build`, `pre-run` being the script which calls `aboutFileFromPackageJson`

# API

## `aboutFileFromPackageJson`

Parameters:

- `packageJsonObject` - object imported from `package.json`. For example as a result of `require("./package.json")`
- `pattern` - an object which strictly mimics parts of the `package.json` file. Only its structure is used, its terminal values are ignored as they are taken from `packageJsonObject` instead
- `jsonFilePath` - path and file name of the JSON file to create or update
- `buildFunction` - a function, if defined will replace the _default_ `build` property handler. It takes the present `build` property string possibly found in previously written JSON file (or `null` if no such file existed) and is expected to return the next one. The default built function is `makeBuildStr` (see below) acting on `Date.now()`

## `lowLevelStuff`

These are exports specially intended for unit tests

### `incrementBuildString`

Takes a string defined as in the `build` property section (without the leading dot if length of more than one character) and returns a string with value increased by one. Examples: `"9"` will return `"A"`, `"f"` will return `"10"`, `"aZz"` will return `"aa0"`

### `makeBuildStr`

_Reminder_: default `build` property consists of two parts: the number of days since Wednesday, 2020/01/01 and a letter (0-9A-Za-z) representing the number of builds in the same day. If that letter overflows it is replaced by a string consisting of a dot plus two or more letters. In this section, let's call `d` the number of days and `n` the number of strings within the same day (for example: `"3"`, `"B"`, or `".1H"`)

`makeBuildStr` takes a `Date` type and a `build` property and will return the _next_ `build` property. This means that if given date corresponds `d`, the additional letter(s) `n` appended to `d` will by increased if `d` has the same value as the provided `build` property. If build property is not correct (e.g. `null`) or its `d` part does not match `d`, then `d` with an appended `0` will be returned

Examples where given date 2021/07/15 which corresponds to `d` equal to `"562"`:

- `"foo"`, `"5558"`, `"561.abc"`, `null` will return `"5620"`
- `"562a"` will return `"562b"`
- `"562z"` will return `"562.10"`
