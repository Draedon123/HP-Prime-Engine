import * as acorn from "acorn";
import * as fs from "fs";
import * as path from "path";
import { __dirname } from "./globals";

type CodeTargetLocation = "toplevel" | number;

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
        case "ImportDeclaration": {
          this.handleImportDeclaration(statement);
          break;
        }
        case "BlockStatement":
        case "VariableDeclaration":
        case "IfStatement":
        case "ExpressionStatement":
        case "EmptyStatement":
        case "DebuggerStatement":
        case "WithStatement":
        case "ReturnStatement":
        case "LabeledStatement":
        case "BreakStatement":
        case "ContinueStatement":
        case "SwitchStatement":
        case "ThrowStatement":
        case "TryStatement":
        case "WhileStatement":
        case "DoWhileStatement":
        case "ForStatement":
        case "ForInStatement":
        case "ForOfStatement":
        case "FunctionDeclaration":
        case "ClassDeclaration": {
          this.handleStatement(statement, "toplevel");
          break;
        }
        case "ExportNamedDeclaration":
        case "ExportDefaultDeclaration":
        case "ExportAllDeclaration":
        default: {
          console.error(
            `Unsupported statement or module declaration type "${statement.type}"`
          );
        }
      }
    }

    console.log("Namespace Imports: ", this.namespaceImport);
    console.log("Named Imports: ", this.namedImports);

    return this.topLevelCode + "\n" + Compiler.BOILERPLATE;
  }

  private handleStatement(
    statement: acorn.Statement,
    target: CodeTargetLocation
  ) {
    switch (statement.type) {
      case "VariableDeclaration": {
        this.handleVariableDeclaration(statement, target);
        break;
      }
      case "ExpressionStatement": {
        this.handleExpression(statement, target);

        break;
      }
      case "IfStatement": {
        this.handleIf(statement, target);
        break;
      }
      case "BlockStatement": {
        this.handleBlock(statement, target);
        break;
      }
      case "EmptyStatement":
      case "DebuggerStatement":
      case "WithStatement":
      case "ReturnStatement":
      case "LabeledStatement":
      case "BreakStatement":
      case "ContinueStatement":
      case "SwitchStatement":
      case "ThrowStatement":
      case "TryStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "FunctionDeclaration":
      case "ClassDeclaration":
      default: {
        console.error(`Unsupported statement type ${statement.type}`);

        break;
      }
    }
  }

  private handleVariableDeclaration(
    statement: acorn.VariableDeclaration,
    target: CodeTargetLocation
  ) {
    const transpiled = this.transpileVariableDeclaration(statement);
    this.write(transpiled, target);
  }

  private handleImportDeclaration(statement: acorn.ImportDeclaration) {
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

  private handleExpression(
    statement: acorn.ExpressionStatement,
    target: CodeTargetLocation
  ) {
    const expression = statement.expression;
    const transpiled = this.transpileExpression(expression);

    if (transpiled !== null) {
      this.write(transpiled + ";\n", target);
    }
  }

  private handleIf(statement: acorn.IfStatement, target: CodeTargetLocation) {
    const transpiled = this.transpileIf(statement);

    if (transpiled !== null) {
      this.write(transpiled + ";\n", target);
    }
  }

  private handleBlock(
    statement: acorn.BlockStatement,
    target: CodeTargetLocation
  ) {
    const transpiled = this.transpileBlock(statement);

    this.write(transpiled, target);
  }

  private transpileStatement(statement: acorn.Statement): string | null {
    switch (statement.type) {
      case "ExpressionStatement": {
        return this.transpileExpression(statement.expression);
      }
      case "IfStatement": {
        return this.transpileIf(statement);
      }
      case "VariableDeclaration": {
        return this.transpileVariableDeclaration(statement);
      }
      case "BlockStatement": {
        return this.transpileBlock(statement);
      }
      case "EmptyStatement":
      case "DebuggerStatement":
      case "WithStatement":
      case "ReturnStatement":
      case "LabeledStatement":
      case "BreakStatement":
      case "ContinueStatement":
      case "SwitchStatement":
      case "ThrowStatement":
      case "TryStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "FunctionDeclaration":
      case "ClassDeclaration":
      default: {
        console.error(`Unsupported statement type "${statement.type}"`);
        return null;
      }
    }
  }

  private transpilePattern(pattern: acorn.Pattern): string | null {
    switch (pattern.type) {
      case "Identifier": {
        return this.transpileIdentifier(pattern);
      }
      case "MemberExpression":
      case "ObjectPattern":
      case "ArrayPattern":
      case "RestElement":
      case "AssignmentPattern": {
        console.error(`Unsupported pattern "${pattern.type}"`);
        return null;
      }
    }
  }

  private transpileVariableDeclaration(
    declaration: acorn.VariableDeclaration
  ): string {
    let transpiledDeclaration = "";

    for (const declarator of declaration.declarations) {
      const transpiledDeclarator = this.transpileVariableDeclarator(
        declaration.kind,
        declarator
      );

      if (transpiledDeclarator !== null) {
        transpiledDeclaration += transpiledDeclarator + ";\n";
      }
    }

    return transpiledDeclaration;
  }

  private transpileVariableDeclarator(
    type: acorn.VariableDeclaration["kind"],
    statement: acorn.VariableDeclarator
  ): string | null {
    let transpiledValue: string | null = null;

    if (statement.init !== undefined && statement.init !== null) {
      transpiledValue = this.transpileExpression(statement.init);
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
      return null;
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
        return null;
      }
    }
  }

  private transpileExpression(expression: acorn.Expression): string | null {
    switch (expression.type) {
      case "Identifier": {
        return this.transpileIdentifier(expression);
      }
      case "Literal": {
        return this.transpileLiteral(expression);
      }
      case "AssignmentExpression": {
        return this.transpileAssignment(expression);
      }
      case "BinaryExpression": {
        return this.transpileBinaryExpression(expression);
      }
      case "ThisExpression":
      case "ArrayExpression":
      case "ObjectExpression":
      case "FunctionExpression":
      case "UnaryExpression":
      case "UpdateExpression":
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
        console.error(`Unsupported expression type "${expression.type}"`);
        return null;
      }
    }
  }

  private transpileIf(statement: acorn.IfStatement): string | null {
    const test = this.transpileExpression(statement.test);
    const consequent = this.transpileStatement(statement.consequent);
    const alternate = statement.alternate
      ? this.transpileStatement(statement.alternate)
      : undefined;

    if (test === null || consequent === null || alternate === null) {
      return null;
    }

    if (alternate === undefined) {
      return `IF ${test} THEN\n${consequent}\nEND`;
    } else {
      return `IF ${test} THEN\n${consequent}\nELSE\n${alternate}\nEND`;
    }
  }

  private transpileBlock(statement: acorn.BlockStatement): string {
    if (statement.body.length === 0) {
      return "";
    }

    const transpiled = statement.body
      .map((statement) => this.transpileStatement(statement))
      .filter((transpiled) => transpiled !== null);

    return transpiled.join(";\n") + ";\n";
  }

  private transpileIdentifier(identifier: acorn.Identifier): string {
    return identifier.name;
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

  private transpileAssignment(
    assignment: acorn.AssignmentExpression
  ): string | null {
    const left = this.transpilePattern(assignment.left);
    const right = this.transpileExpression(assignment.right);

    if (left === null || right === null) {
      return null;
    }

    switch (assignment.operator) {
      case "=": {
        return `${left} = ${right}`;
      }
      case "+=": {
        return `${left} = ${left} + ${right}`;
      }
      case "-=": {
        return `${left} = ${left} - ${right}`;
      }
      case "*=": {
        return `${left} = ${left} * ${right}`;
      }
      case "/=": {
        return `${left} = ${left} / ${right}`;
      }
      case "%=": {
        return `${left} = ${left} MOD ${right}`;
      }
      case "<<=":
      case ">>=":
      case ">>>=":
      case "|=":
      case "^=":
      case "&=":
      case "**=":
      case "||=":
      case "&&=":
      case "??=":
      default: {
        console.error(`Unsupported assignment operator ${assignment.operator}`);
        return null;
      }
    }
  }

  private transpileBinaryExpression(
    binary: acorn.BinaryExpression
  ): string | null {
    const left =
      binary.left.type === "PrivateIdentifier"
        ? this.transpilePrivateIdentifier(binary.left)
        : this.transpileExpression(binary.left);
    const right = this.transpileExpression(binary.right);

    if (left === null || right === null) {
      return null;
    }

    switch (binary.operator) {
      case "+":
      case "-":
      case "*":
      case "==":
      case "!=":
      case "<":
      case ">":
      case "/": {
        return `${left} ${binary.operator} ${right}`;
      }
      case "%": {
        return `${left} MOD ${right}`;
      }
      case "===":
      case "!==":
      case "<=":
      case ">=":
      case "<<":
      case ">>":
      case ">>>":
      case "|":
      case "^":
      case "&":
      case "in":
      case "instanceof":
      case "**":
      default: {
        console.error(
          `Unsupported binary expression operator "${binary.operator}"`
        );

        return null;
      }
    }
  }

  private transpilePrivateIdentifier(
    identifier: acorn.PrivateIdentifier
  ): string {
    return identifier.name;
  }

  private write(code: string, target: CodeTargetLocation) {
    if (target === "toplevel") {
      this.topLevelCode += code;
    } else {
      this.transpiledFunctions[target] += code;
    }
  }
}

export { Compiler };
