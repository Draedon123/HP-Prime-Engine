import * as path from "node:path";
import * as fs from "node:fs";

const projectRoot = path.resolve(__dirname, "../../");

const args = process.argv.slice(2);
const _inputFilePath = args[0];

if (_inputFilePath === undefined) {
  throw new Error("Did not receive path to input file");
}

const inputFilePath = path.resolve(projectRoot, _inputFilePath);

if (!fs.existsSync(inputFilePath)) {
  throw new Error(`Input path does not exist: ${inputFilePath}`);
}

const inputFileContents = fs.readFileSync(inputFilePath, { encoding: "utf8" });

fs.writeFileSync(path.resolve(projectRoot, "build.hpppl"), inputFileContents);
