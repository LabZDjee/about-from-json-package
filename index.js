/* jshint esversion: 6 */

const fs = require("fs");
const { makeSubObjectFrom } = require("@labzdjee/object-browse");

const milliSecPerDay = 1000 * 60 * 60 * 24;
const initialDay = Math.floor(Date.parse("2020/01/01 00:00") / milliSecPerDay);

function makeDaysFromInitalDay(date) {
  return Math.floor(date / milliSecPerDay) - initialDay;
}

const buildFinalLetterList = [];

for (let i = 0; i < 10; i++) {
  buildFinalLetterList.push(String.fromCharCode(0x30 + i));
}

for (let i = 0; i < 26; i++) {
  buildFinalLetterList.push(String.fromCharCode(0x41 + i));
}

for (let i = 0; i < 26; i++) {
  buildFinalLetterList.push(String.fromCharCode(0x61 + i));
}

const buildFinalLetterLength = buildFinalLetterList.length;

function incrementBuildString(str) {
  const list = str.split("").map((x) => buildFinalLetterList.indexOf(x));
  let i = list.length - 1;
  list[i]++;
  for (; i >= 0; i--) {
    if (list[i] >= buildFinalLetterLength) {
      list[i] = 0;
      if (i === 0) {
        list.unshift(1);
      } else {
        list[i - 1]++;
      }
    }
  }
  return list.map((x) => buildFinalLetterList[x]).join("");
}

function makeBuildStr(date, initialBuildStr) {
  const test = /^(\d+)(?:(\.)([0-9A-Za-z]+)|([0-9A-Za-z]))$/.exec(initialBuildStr);
  const currentDay = makeDaysFromInitalDay(date);
  if (test === null || currentDay.toString() !== test[1]) {
    return `${currentDay}0`;
  } else {
    const oldBuildString = test[2] === "." ? test[3] : test[4];
    const newBuildString = incrementBuildString(oldBuildString);
    return `${currentDay}${newBuildString.length > 1 ? "." : ""}${newBuildString}`;
  }
}

function aboutFileFromPackageJson(packageJsonObject, pattern, jsFilePath, buildFunction) {
  if (typeof buildFunction !== "function") {
    buildFunction = function (initialBuildStr) {
      return makeBuildStr(Date.now(), initialBuildStr);
    };
  }
  let aboutObject;
  if (fs.existsSync(jsFilePath)) {
    aboutObject = require(jsFilePath);
  } else {
    aboutObject = { build: null, packageJson: null };
  }
  aboutObject.build = buildFunction(aboutObject.build);
  const subJsonOutcome = makeSubObjectFrom(pattern, packageJsonObject);
  if (subJsonOutcome.completed === false) {
    throw new Error(subJsonOutcome.result);
  }
  aboutObject.packageJson = subJsonOutcome.result;
  fs.writeFileSync(jsFilePath, JSON.stringify(aboutObject, null, 1));
}

exports.lowLevelStuff = { incrementBuildString, makeBuildStr };
exports.aboutFileFromPackageJson = aboutFileFromPackageJson;
