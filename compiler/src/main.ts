import * as path from "node:path";
import * as fs from "node:fs";
import { Compiler } from "./Compiler";

const args = process.argv.slice(2);
const _inputFilePath = args[0];

if (_inputFilePath === undefined) {
  throw new Error("Did not receive path to input file");
}

const projectRoot = path.resolve(__dirname, "../../");
const inputFilePath = path.resolve(projectRoot, _inputFilePath);
const outputFilePath = path.resolve(projectRoot, "build.hpppl");

const compiler = new Compiler(inputFilePath);
const compiled = compiler.compile();

fs.writeFileSync(outputFilePath, compiled);
