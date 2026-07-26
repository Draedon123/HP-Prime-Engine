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
  private topLevelCode: string;
  private transpiledFunctions: string[];

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
    this.namedImports = {};
    this.namespaceImport = new Set();
    this.topLevelCode = "";
    this.transpiledFunctions = [];
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
          this.handleVariableDeclaration(statement, "toplevel");

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

    return this.topLevelCode + "\n" + Compiler.BOILERPLATE;
  }

  private handleVariableDeclaration(
    statement: acorn.VariableDeclaration,
    target: "toplevel" | number
  ) {
    for (const declaration of statement.declarations) {
      const transpiled = this.transpileVariableDeclaration(
        statement.kind,
        declaration
      );

      this.write(transpiled + ";\n", target);
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

  private transpileVariableDeclaration(
    type: acorn.VariableDeclaration["kind"],
    statement: acorn.VariableDeclarator
  ): string {
    let transpiledValue: string | null = null;

    if (statement.init !== undefined && statement.init !== null) {
      switch (statement.init.type) {
        case "Literal": {
          transpiledValue = this.transpileLiteral(statement.init);
          break;
        }

        case "Identifier": {
          transpiledValue = statement.init.type;
          break;
        }

        case "ThisExpression":
        case "ArrayExpression":
        case "ObjectExpression":
        case "FunctionExpression":
        case "UnaryExpression":
        case "UpdateExpression":
        case "BinaryExpression":
        case "AssignmentExpression":
        case "LogicalExpression":
        case "MemberExpression":
        case "ConditionalExpression":
        case "CallExpression":
        case "NewExpression":
        case "SequenceExpression":
        case "ArrowFunctionExpression":
        case "YieldExpression":
        case "TemplateLiteral":
        case "TaggedTemplateExpression":
        case "ClassExpression":
        case "MetaProperty":
        case "AwaitExpression":
        case "ChainExpression":
        case "ImportExpression":
        case "ParenthesizedExpression":
        default: {
          console.error(
            `Unsupported expression type for variable declaration "${statement.init.type}"`
          );
          break;
        }
      }
    }

    let declarationKeyword: string | null = null;

    switch (type) {
      case "let": {
        declarationKeyword = "LOCAL";
        break;
      }

      case "const": {
        declarationKeyword = "CONST";
        break;
      }

      case "var":
      case "using":
      case "await using":
      default: {
        console.error(`Unsupported variable declaration type "${type}"`);
        break;
      }
    }

    if (declarationKeyword === null) {
      return "";
    }

    switch (statement.id.type) {
      case "Identifier": {
        if (transpiledValue === null) {
          return `${declarationKeyword} ${statement.id.name}`;
        } else {
          return `${declarationKeyword} ${statement.id.name} = ${transpiledValue}`;
        }
      }
      case "MemberExpression":
      case "ObjectPattern":
      case "ArrayPattern":
      case "RestElement":
      case "AssignmentPattern":
      default: {
        console.error(
          `Unsupported variable declaration id type "${statement.id.type}"`
        );
        return "";
      }
    }
  }

  private transpileLiteral(literal: acorn.Literal): string | null {
    switch (typeof literal.value) {
      case "string":
        return `"${literal.value}"`;
      case "number":
        return literal.value.toString();
      case "boolean":
        return literal.value ? "1" : "0";
      case "bigint":
      case "symbol":
      case "undefined":
      case "object":
      case "function":
      default: {
        console.error(`Literal type "${typeof literal}" not supported`);
        return null;
      }
    }
  }

  private write(code: string, target: "toplevel" | number) {
    if (target === "toplevel") {
      this.topLevelCode += code;
    } else {
      this.transpiledFunctions[target] += code;
    }
  }
}

export { Compiler };
