import * as path from "node:path";
import * as fs from "node:fs";
import * as url from "node:url";

const __filename = url.fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");

const args = process.argv.slice(2);
const _inputFilePath = args[0];
const _outputFilePath = args[1];

if (_inputFilePath === undefined) {
  throw new Error("Did not receive path to input file");
}

if (_outputFilePath === undefined) {
  throw new Error("Did not receive output path");
}

const inputFilePath = path.resolve(projectRoot, _inputFilePath);
const outputFilePath = path.resolve(projectRoot, _outputFilePath);

if (!fs.existsSync(inputFilePath)) {
  throw new Error(`Input path does not exist: ${inputFilePath}`);
}

if (!fs.existsSync(outputFilePath)) {
  throw new Error(`Output path does not exist: ${outputFilePath}`);
}

const inputFileContents = fs.readFileSync(inputFilePath, { encoding: "utf8" });

fs.writeFileSync(path.resolve(projectRoot, "build.hpppl"), inputFileContents);
