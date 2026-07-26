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
  private namedImports: Record<string, string>;
  private namespaceImport: Set<string>;
  private readonly topLevelConstants: Record<string, string | number>;

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
    this.topLevelConstants = {};
    this.namedImports = {};
    this.namespaceImport = new Set();
  }

  public compile(): string {
    if (!fs.existsSync(this.inputFilePath)) {
      throw new Error(`Input path does not exist: ${this.inputFilePath}`);
    }

    const fileContents = fs.readFileSync(this.inputFilePath, {
      encoding: "utf8",
    });

    const parsedProgram = acorn.parse(fileContents, {
      ecmaVersion: "latest",
      sourceType: "module",
    });

    for (const statement of parsedProgram.body) {
      switch (statement.type) {
        case "VariableDeclaration": {
          this.handleTopLevelDeclarationStatement(statement);

          break;
        }

        case "ImportDeclaration": {
          this.handleImportDeclarationStatement(statement);

          break;
        }

        default: {
          console.error(`Unsupported statement type ${statement.type}`);

          break;
        }
      }
    }

    console.log("Namespace Imports: ", this.namespaceImport);
    console.log("Named Imports: ", this.namedImports);

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

  private handleImportDeclarationStatement(statement: acorn.ImportDeclaration) {
    if (statement.source.value !== "hp_prime") {
      console.error("Module imports other than hp_prime are unsupported");

      return;
    }

    for (const specifier of statement.specifiers) {
      switch (specifier.type) {
        case "ImportNamespaceSpecifier": {
          this.namespaceImport.add(specifier.local.name);

          break;
        }
        case "ImportSpecifier": {
          if (specifier.imported.type === "Identifier") {
            if (specifier.imported.name === "default") {
              this.namespaceImport.add(specifier.local.name);
            } else {
              this.namedImports[specifier.local.name] = specifier.imported.name;
            }
          } else {
            // this is the case: import { "string name" as alias } from "module"
            this.namedImports[specifier.local.name] = specifier.imported
              .value as string;
          }

          break;
        }
        case "ImportDefaultSpecifier": {
          this.namespaceImport.add(specifier.local.name);

          break;
        }
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
