/* jshint esversion: 6 */

const { incrementBuildString, makeBuildStr } = require("./index").lowLevelStuff;
const aboutFileFromPackageJson = require("./index").aboutFileFromPackageJson;

const { greenBright, red, redBright, yellow } = require("chalk");
const fs = require("fs");

function testIncrementBuildString() {
  const checkPoints = [4, 38, 12194];
  const expectedResults = ["3", "b", "3Af"];
  let str = "0";
  for (let i = 1; i <= 13000; i++) {
    const resultIndex = checkPoints.indexOf(i);
    if (resultIndex >= 0) {
      if (expectedResults[resultIndex] !== str) {
        return { step: i, expected: expectedResults[resultIndex], got: str };
      }
    }
    str = incrementBuildString(str);
  }
  return true;
}

const testDate = "2021/07/15 01:23";

function testMakeBuildStr() {
  const date = Date.parse(testDate);
  try {
    [
      { old: "5615", new: "5616" },
      { old: "561.zz", new: "561.100" },
      { old: "561z", new: "561.10" },
      { old: "560.zz", new: "5610" },
      { old: "12xu", new: "5610" },
      { old: null, new: "5610" },
      { new: "5610" },
    ].forEach((x) => {
      if (x.new !== makeBuildStr(date, x.old)) {
        throw x;
      }
    });
  } catch (e) {
    return e;
  }
  return true;
}
function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath));
}

let step = 1;
let errors = 0;
console.log(`Test #${step++}: incrementBuildString`);
let t = testIncrementBuildString();
if (t !== true) {
  console.log(red(` failure with vector: ${JSON.stringify(t)}`));
  errors++;
}
console.log(`Test #${step++}: makeBuildStr`);
t = testMakeBuildStr();
if (t !== true) {
  console.log(red(` failure with vector: ${JSON.stringify(t)} for date: ${testDate}`));
  errors++;
}

console.log(`Test #${step++}: aboutFileFromPackageJson (on a non existing about json file)`);
const aboutJsonPath = "./temp/about.json";
const packageObject = require("./package.json");
const pattern = {
  name: null,
  version: null,
  description: null,
  author: null,
  license: null,
  dependencies: { "@labzdjee/object-browse": null },
};
function testJsonPart(org, cpy) {
  return (
    org.name === cpy.name &&
    org.version === cpy.version &&
    org.description === cpy.description &&
    org.author === cpy.author &&
    org.license === cpy.license &&
    org.dependencies["@labzdjee/object-browse"] === cpy.dependencies["@labzdjee/object-browse"]
  );
}
if (fs.existsSync(aboutJsonPath)) {
  fs.unlinkSync(aboutJsonPath);
}
aboutFileFromPackageJson(packageObject, pattern, aboutJsonPath);
let aboutObject = require(aboutJsonPath);
if (!testJsonPart(packageObject, aboutObject.packageJson) || aboutObject.packageJson.homepage !== undefined) {
  console.log(red(" packageJson part of about JSON file does not match expected contents"));
  errors++;
}
let expectedBuild = makeBuildStr(Date.now());
if (aboutObject.build !== expectedBuild) {
  console.log(
    red(` wrong build property in about json file, expected: ${expectedBuild}, actual: ${aboutObject.build}`)
  );
  errors++;
}

console.log(`Test #${step++}: aboutFileFromPackageJson (on an existing about json file)`);
aboutFileFromPackageJson(packageObject, pattern, aboutJsonPath);
aboutObject = readJsonFile(aboutJsonPath);
if (!testJsonPart(packageObject, aboutObject.packageJson) || aboutObject.packageJson.homepage !== undefined) {
  console.log(red(" packageJson part of about JSON file does not match expected contents"));
  errors++;
}
expectedBuild = incrementBuildString(expectedBuild);
if (aboutObject.build !== expectedBuild) {
  console.log(
    red(` wrong build property in about json file, expected: ${expectedBuild}, actual: ${aboutObject.build}`)
  );
  errors++;
}
console.log(`Test #${step++}: aboutFileFromPackageJson (with a custom build function)`);
aboutFileFromPackageJson(packageObject, pattern, aboutJsonPath, (x) => `**${x}**`);
if (!testJsonPart(packageObject, aboutObject.packageJson) || aboutObject.packageJson.homepage !== undefined) {
  console.log(red(" packageJson part of about JSON file does not match expected contents"));
  errors++;
}
aboutObject = readJsonFile(aboutJsonPath);
expectedBuild = `**${expectedBuild}**`;
if (aboutObject.build !== expectedBuild) {
  console.log(
    red(` wrong build property in about json file, expected: ${expectedBuild}, actual: ${aboutObject.build}`)
  );
  errors++;
}
if (fs.existsSync(aboutJsonPath)) {
  fs.unlinkSync(aboutJsonPath);
}
console.log(`Test #${step++}: aboutFileFromPackageJson (custom build function on a non existing about json file)`);
aboutFileFromPackageJson(packageObject, pattern, aboutJsonPath, (x) => x);
aboutObject = readJsonFile(aboutJsonPath);
if (aboutObject.build !== null) {
  console.log(red(` wrong build property in about json file, expected: null, actual: ${aboutObject.build}`));
  errors++;
}
aboutFileFromPackageJson(packageObject, pattern, aboutJsonPath);

if (errors) {
  console.log(redBright(`FAILED with ${errors} error${errors > 1 ? "s" : ""}`));
} else {
  console.log(greenBright("PASS"));
}
