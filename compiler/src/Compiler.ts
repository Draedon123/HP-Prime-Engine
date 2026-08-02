import * as acorn from "acorn";
import * as fs from "node:fs";
import * as path from "node:path";

class Compiler {
  private static readonly BOILERPLATE: string = fs.readFileSync(
    path.resolve(__dirname, "../assets/boilerplate.hpppl"),
    { encoding: "utf8" }
  );

  private static readonly KEYS: Record<import("./index").Key, number> = {
    Apps: 0,
    Symb: 1,
    Up: 2,
    Help: 3,
    Esc: 4,
    Home: 5,
    Plot: 6,
    Left: 7,
    Right: 8,
    View: 9,
    CAS: 10,
    Num: 11,
    Down: 12,
    Menu: 13,
    Vars: 14,
    Toolbox: 15,
    Template: 16,
    Define: 17,
    Fraction: 18,
    Backspace: 19,
    Power: 20,
    Sin: 21,
    Cos: 22,
    Tan: 23,
    Ln: 24,
    Log: 25,
    Square: 26,
    PlusMinus: 27,
    Parentheses: 28,
    Comma: 29,
    Enter: 30,
    EEX: 31,
    7: 32,
    8: 33,
    9: 34,
    Divide: 35,
    Alpha: 36,
    4: 37,
    5: 38,
    6: 39,
    Multiply: 40,
    Shift: 41,
    1: 42,
    2: 43,
    3: 44,
    Minus: 5,
    On: 46,
    0: 47,
    Dot: 48,
    Space: 49,
    Plus: 50,
  };

  private readonly inputFilePath: string;
  private namedImports: Record<string, string>;
  private namespaceImport: Set<string>;
  private topLevelCode: string;
  private numSwitches: number;

  constructor(inputFilePath: string) {
    this.inputFilePath = inputFilePath;
    this.namedImports = {};
    this.namespaceImport = new Set();
    this.topLevelCode = "";
    this.numSwitches = 0;
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
          this.handleStatement(statement);
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

    return this.topLevelCode + "\n" + Compiler.BOILERPLATE;
  }

  private handleStatement(statement: acorn.Statement) {
    switch (statement.type) {
      case "VariableDeclaration": {
        this.handleVariableDeclaration(statement);
        break;
      }
      case "ExpressionStatement": {
        this.handleExpression(statement);

        break;
      }
      case "IfStatement": {
        this.handleIf(statement);
        break;
      }
      case "BlockStatement": {
        this.handleBlock(statement);
        break;
      }
      case "FunctionDeclaration": {
        this.handleFunctionDeclaration(statement);
        break;
      }
      case "ReturnStatement": {
        this.handleReturn(statement);
        break;
      }
      case "DebuggerStatement": {
        this.handleDebugger(statement);
        break;
      }
      case "EmptyStatement": {
        this.handleEmpty(statement);
        break;
      }
      case "TryStatement": {
        this.handleTry(statement);
        break;
      }
      case "WithStatement": {
        this.handleWith(statement);
        break;
      }
      case "LabeledStatement": {
        this.handleLabeled(statement);
        break;
      }
      case "BreakStatement": {
        this.handleBreak(statement);
        break;
      }
      case "ContinueStatement": {
        this.handleContinue(statement);
        break;
      }
      case "SwitchStatement": {
        this.handleSwitch(statement);
        break;
      }
      case "ThrowStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
      case "ClassDeclaration":
      default: {
        console.error(`Unsupported statement type ${statement.type}`);

        break;
      }
    }
  }

  private handleVariableDeclaration(statement: acorn.VariableDeclaration) {
    const transpiled = this.transpileVariableDeclaration(statement);
    this.write(transpiled);
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

  private handleExpression(statement: acorn.ExpressionStatement) {
    const expression = statement.expression;
    const transpiled = this.transpileExpression(expression);

    if (transpiled !== null) {
      this.write(transpiled + ";\n");
    }
  }

  private handleIf(statement: acorn.IfStatement) {
    const transpiled = this.transpileIf(statement);

    if (transpiled !== null) {
      this.write(transpiled + ";\n");
    }
  }

  private handleBlock(statement: acorn.BlockStatement): void {
    const transpiled = this.transpileBlock(statement);

    this.write(transpiled);
  }

  private handleFunctionDeclaration(
    statement: acorn.FunctionDeclaration
  ): void {
    const transpiled = this.transpileFunctionDeclaration(statement);

    this.write(transpiled);
  }

  private handleReturn(statement: acorn.ReturnStatement): void {
    const transpiled = this.transpileReturn(statement);

    this.write(transpiled);
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private handleDebugger(statement: acorn.DebuggerStatement): void {
    return;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private handleEmpty(statement: acorn.EmptyStatement): void {
    return;
  }

  private handleTry(statement: acorn.TryStatement): void {
    const transpiled = this.transpileTry(statement);

    this.write(transpiled);
  }

  private handleWith(statement: acorn.WithStatement): void {
    console.warn(
      `The "with" statement is a deprecated JavaScript feature. The outer "with" statement will be dropped, leaving only the inside block`
    );

    const transpiled = this.transpileStatement(statement.body);

    if (transpiled !== null) {
      this.write(transpiled);
    }
  }

  private handleLabeled(statement: acorn.LabeledStatement): void {
    console.warn(
      `Labelled "break" and "continue" statements are not supported`
    );

    this.handleStatement(statement.body);
  }

  private handleBreak(statement: acorn.BreakStatement): void {
    if (statement.label) {
      const label = this.transpileIdentifier(statement.label);

      console.warn(
        `Specifically breaking from label "${label}" is not supported`
      );
    }

    const transpiled = this.transpileBreak(statement);

    this.write(transpiled);
  }

  private handleContinue(statement: acorn.ContinueStatement): void {
    if (statement.label) {
      const label = this.transpileIdentifier(statement.label);

      console.warn(
        `Specifically continuing from label "${label}" is not supported`
      );
    }

    const transpiled = this.transpileContinue(statement);

    this.write(transpiled);
  }

  private handleSwitch(statement: acorn.SwitchStatement): void {
    const transpiled = this.transpileSwitchStatment(statement);

    this.write(transpiled);
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
      case "ReturnStatement": {
        return this.transpileReturn(statement);
      }
      case "TryStatement": {
        return this.transpileTry(statement);
      }
      case "BreakStatement": {
        return this.transpileBreak(statement);
      }
      case "ContinueStatement": {
        return this.transpileContinue(statement);
      }
      case "SwitchStatement": {
        return this.transpileSwitchStatment(statement);
      }
      case "FunctionDeclaration": {
        return this.transpileFunctionDeclaration(statement);
      }
      case "EmptyStatement":
      case "DebuggerStatement":
      case "WithStatement":
      case "LabeledStatement": {
        return null;
      }
      case "ThrowStatement":
      case "WhileStatement":
      case "DoWhileStatement":
      case "ForStatement":
      case "ForInStatement":
      case "ForOfStatement":
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
          return `${declarationKeyword} ${statement.id.name} := ${transpiledValue}`;
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
      case "CallExpression": {
        return this.transpileCall(expression);
      }
      case "MemberExpression": {
        return this.transpileMember(expression);
      }
      case "ArrayExpression": {
        return this.transpileArrayExpression(expression);
      }
      case "ThisExpression":
      case "ObjectExpression":
      case "FunctionExpression":
      case "UnaryExpression":
      case "UpdateExpression":
      case "LogicalExpression":
      case "ConditionalExpression":
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

    return transpiled.join(";\n");
  }

  private transpileFunctionDeclaration(
    statement: acorn.FunctionDeclaration
  ): string {
    const name = this.transpileIdentifier(statement.id);
    const parameters = statement.params
      .map((parameter) => this.transpilePattern(parameter))
      .filter((parameter) => parameter !== null)
      .join(",");
    const body = this.transpileBlock(statement.body);

    return `${name}(${parameters})\nBEGIN\n${body}\nEND;`;
  }

  private transpileReturn(statement: acorn.ReturnStatement): string {
    const returnArgument = statement.argument
      ? (this.transpileExpression(statement.argument) ?? "")
      : "";

    return `RETURN ${returnArgument}`;
  }

  private transpileTry(statement: acorn.TryStatement): string {
    const tryBlock = this.transpileBlock(statement.block);
    const catchBlock = statement.handler
      ? this.transpileCatch(statement.handler)
      : "";
    const finallyBlock = statement.finalizer
      ? this.transpileBlock(statement.finalizer)
      : "";

    return `IFERR\n${tryBlock}\nTHEN\n${catchBlock}\nEND;\n${finallyBlock === "" ? "" : this.wrapInBlock(finallyBlock)}\n`;
  }

  private transpileCatch(statement: acorn.CatchClause): string {
    if (statement.param) {
      const parameter = this.transpilePattern(statement.param);

      if (parameter !== "_") {
        console.warn(
          `"Try-catch" error parameter "${parameter}" will be removed in compilation. Ensure your code does not reference it.`
        );
      }
    }

    return this.transpileBlock(statement.body);
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private transpileBreak(statement: acorn.BreakStatement): string {
    return "BREAK;\n";
  }
  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private transpileContinue(statement: acorn.ContinueStatement): string {
    return "CONTINUE;\n";
  }

  private transpileSwitchStatment(statement: acorn.SwitchStatement): string {
    const tempVariable = `__temp_switch__${this.numSwitches++}`;
    const tempVariableDeclaration = this.transpileVariableDeclaration({
      type: "VariableDeclaration",
      start: 0,
      end: 0,
      kind: "const",
      declarations: [
        {
          type: "VariableDeclarator",
          start: 0,
          end: 0,
          id: {
            type: "Identifier",
            start: 0,
            end: 0,
            name: tempVariable,
          },
          init: statement.discriminant,
        },
      ],
    });

    const transpiledCases = statement.cases
      .map((switchCase) => this.transpileSwitchCase(tempVariable, switchCase))
      .filter((transpiled) => transpiled !== null)
      .join("\n");

    return `${tempVariableDeclaration}\nCASE\n${transpiledCases}\nEND;\n`;
  }

  private transpileSwitchCase(
    testVariable: string,
    switchCase: acorn.SwitchCase
  ): string | null {
    const transpiledBodyStatements: string[] = [];

    for (let i = 0; i < switchCase.consequent.length; i++) {
      const statement = switchCase.consequent[i];

      switch (statement.type) {
        case "BlockStatement": {
          for (let j = 0; j < statement.body.length; j++) {
            const subStatement = statement.body[j];

            if (subStatement.type === "BreakStatement") {
              if (j !== statement.body.length - 1) {
                console.warn(
                  '"Break" statements in a "switch" case are only supported at the end of the block. For example, you will need to rewrite if(x){break}y as if(x){}{y}'
                );
              }

              statement.body.splice(j, 1);
              j--;
            }
          }

          const transpiled = this.transpileBlock(statement);
          transpiledBodyStatements.push(transpiled);

          break;
        }
        default: {
          console.error("Switch cases must be in blocks. I.e., case x: {...}");

          break;
        }
      }
    }

    const transpiledBody = transpiledBodyStatements.join("\n");

    if (switchCase.test === null) {
      // default case
      return `DEFAULT ${transpiledBody};`;
    } else {
      const test = switchCase.test
        ? this.transpileExpression(switchCase.test)
        : null;

      if (test === null) {
        return null;
      }

      return `IF ${testVariable} == ${test} THEN ${transpiledBody}; END;`;
    }
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
        return `${left} := ${right}`;
      }
      case "+=": {
        return `${left} := ${left} + ${right}`;
      }
      case "-=": {
        return `${left} := ${left} - ${right}`;
      }
      case "*=": {
        return `${left} := ${left} * ${right}`;
      }
      case "/=": {
        return `${left} := ${left} / ${right}`;
      }
      case "%=": {
        return `${left} := ${left} MOD ${right}`;
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

  private transpileCall(call: acorn.CallExpression): string | null {
    const callee =
      call.callee.type === "Super"
        ? this.transpileSuper(call.callee)
        : this.transpileExpression(call.callee);
    const args = call.arguments
      .map((argument) =>
        argument.type === "SpreadElement"
          ? this.transpileSpread(argument)
          : this.transpileExpression(argument)
      )
      .filter((arg) => arg !== null);
    const transpiledArguments = args.join(", ");

    return `${callee}(${transpiledArguments})`;
  }

  private transpileMember(member: acorn.MemberExpression): string | null {
    const parent =
      member.object.type === "Super"
        ? this.transpileSuper(member.object)
        : this.transpileExpression(member.object);
    const property =
      member.property.type === "PrivateIdentifier"
        ? this.transpilePrivateIdentifier(member.property)
        : this.transpileExpression(member.property);

    if (parent === null || property === null) {
      return null;
    }

    let parentExpression = member.object;
    let depth = 0;

    while (parentExpression.type === "MemberExpression") {
      parentExpression = parentExpression.object;
      depth++;
    }

    if (
      !this.namespaceImport.has(
        (parentExpression.type === "Super"
          ? this.transpileSuper(parentExpression)
          : this.transpileExpression(parentExpression)) as string
      )
    ) {
      return `${parent}[${property}]`;
    }

    if (depth === 0) {
      return property;
    }

    if (depth == 1) {
      switch (parent) {
        case "COLOURS": {
          // assume colour is hexadecimal
          return property.replaceAll(/[";`]/g, "").toUpperCase() + "h";
        }

        case "KEYS": {
          if (property in Compiler.KEYS) {
            return Compiler.KEYS[property as import("./index").Key].toString();
          } else {
            console.error(`Unknown key "${property}"`);
            return null;
          }
        }
      }
    }

    return null;
  }

  private transpileArrayExpression(expression: acorn.ArrayExpression): string {
    const transpiledElements = expression.elements
      .map((element) =>
        element === null
          ? null
          : element.type === "SpreadElement"
            ? this.transpileSpread(element)
            : this.transpileExpression(element)
      )
      .filter((element) => element !== null)
      .join(",");

    return `[${transpiledElements}]`;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private transpileSuper(expression: acorn.Super): null {
    console.error(`"Super" is unsupported`);
    return null;
  }

  /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
  private transpileSpread(spread: acorn.SpreadElement): null {
    console.error(`"Spread" (...) is unsupported`);
    return null;
  }

  private transpilePrivateIdentifier(
    identifier: acorn.PrivateIdentifier
  ): string {
    return identifier.name;
  }

  private wrapInBlock(code: string): string {
    return `IF 1 THEN\n${code}\nEND;\n`;
  }

  private write(code: string) {
    this.topLevelCode += code;
  }
}

export { Compiler };
