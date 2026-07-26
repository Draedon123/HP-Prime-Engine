import * as acorn from "acorn";
import * as fs from "fs";
import * as path from "path";
import { __dirname } from "./globals";

class Compiler {
  private static readonly BOILERPLATE: string = fs.readFileSync(
    path.resolve(__dirname, "boilerplate.hpppl"),
    { encoding: "utf8" }
  );

  private readonly inputFilePath: string;

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
  }

  public compile(): string {
    if (!fs.existsSync(this.inputFilePath)) {
      throw new Error(`Input path does not exist: ${this.inputFilePath}`);
    }

    const fileContents = fs.readFileSync(this.inputFilePath, {
      encoding: "utf8",
    });

    const parsedProgram = acorn.parse(fileContents, { ecmaVersion: "latest" });

    return Compiler.BOILERPLATE;
  }
}

export { Compiler };
