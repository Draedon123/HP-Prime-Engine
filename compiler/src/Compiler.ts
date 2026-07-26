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
  private readonly topLevelConstants: Record<string, string | number>;

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
    this.topLevelConstants = {};
  }

  public compile(): string {
    if (!fs.existsSync(this.inputFilePath)) {
      throw new Error(`Input path does not exist: ${this.inputFilePath}`);
    }

    const fileContents = fs.readFileSync(this.inputFilePath, {
      encoding: "utf8",
    });

    const parsedProgram = acorn.parse(fileContents, { ecmaVersion: "latest" });

    for (const statement of parsedProgram.body) {
      switch (statement.type) {
        case "VariableDeclaration": {
          this.handleTopLevelDeclarationStatement(statement);

          break;
        }

        default: {
          console.error(`Unsupported statement type ${statement.type}`);

          break;
        }
      }
    }

    return Compiler.BOILERPLATE.replace(
      "__CONSTANTS__",
      this.serialiseTopLevelConstants()
    );
  }

  private handleTopLevelDeclarationStatement(
    statement: acorn.VariableDeclaration
  ): void {
    if (statement.kind === "const") {
      for (const declaration of statement.declarations) {
        if (declaration.init?.type !== "Literal") {
          console.error(
            `Unsupported declaration value type: ${declaration.init?.type}`
          );

          continue;
        }

        const value = declaration.init.value;

        if (typeof value !== "string" && typeof value !== "number") {
          console.error(`Unsupported const declaration value: ${typeof value}`);
          continue;
        }

        if (declaration.id.type !== "Identifier") {
          console.error(
            `[handleTopLevelDeclarationStatement] | Expected declaration.id.type to be "Identifier"`
          );

          continue;
        }

        this.topLevelConstants[declaration.id.name] = value;
      }
    }
  }

  private serialiseTopLevelConstants(): string {
    let serialised = "";

    for (const [name, value] of Object.entries(this.topLevelConstants)) {
      serialised += `CONST ${name} = ${value};\n`;
    }

    return serialised;
  }
}

export { Compiler };
