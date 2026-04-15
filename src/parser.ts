/**
 * Copyright 2026 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import antlr4_lib, { Recognizer, CharStream } from 'antlr4';
const antlr4 = (antlr4_lib as any).atn ? antlr4_lib : (antlr4_lib as any).default;
import { TSESLint } from '@typescript-eslint/utils';
// @ts-ignore
import FirebaseRulesLexer from '../grammar/FirebaseRulesLexer.js';
// @ts-ignore
import FirebaseRulesParser from '../grammar/FirebaseRulesParser.js';

interface CustomSyntaxError extends SyntaxError {
  lineNumber?: number;
  column?: number;
  index?: number;
}

// Extract ErrorListener type from Recognizer to bypass broken antlr4 typings in Node16
type AntlrErrorListener<T> = Parameters<Recognizer<T>['addErrorListener']>[0];
const errorNamespace = (antlr4 as unknown) as {
  error: { ErrorListener: new <T>() => AntlrErrorListener<T> };
};
const BaseErrorListener = errorNamespace.error.ErrorListener;

class ErrorListener extends BaseErrorListener<unknown> {
  public errors: CustomSyntaxError[];

  constructor() {
    super();
    this.errors = [];
  }
  syntaxError(recognizer: unknown, offendingSymbol: { start: number } | undefined, line: number, column: number, msg: string, e: unknown) {
    const err: CustomSyntaxError = new SyntaxError(msg);
    err.lineNumber = line;
    err.column = column + 1;
    err.index = offendingSymbol ? offendingSymbol.start : 0;
    this.errors.push(err);
  }
}

interface ParseResult {
  ast: unknown;
  services: Record<string, unknown>;
  visitorKeys: Record<string, string[]>;
}

export function parseForESLint(code: string, options?: TSESLint.ParserOptions): ParseResult {
  const chars = new antlr4.InputStream(code);
  const lexer = new FirebaseRulesLexer(chars as unknown as CharStream);
  const tokens = new antlr4.CommonTokenStream(lexer);
  const parser = new FirebaseRulesParser(tokens);

  (parser as any).buildParseTrees = true;

  const errorListener = new ErrorListener();
  (lexer as unknown as Recognizer<unknown>).removeErrorListeners();
  (lexer as unknown as Recognizer<unknown>).addErrorListener(errorListener);
  (parser as unknown as Recognizer<unknown>).removeErrorListeners();
  (parser as unknown as Recognizer<unknown>).addErrorListener(errorListener);

  // Parse the entire file ruleset.
  const tree = parser.ruleset();

  if (errorListener.errors.length > 0) {
    throw errorListener.errors[0];
  }

  // Validate rules_version
  const versionStmt = tree.versionStatement();
  if (versionStmt) {
    const stringToken = versionStmt.STRING();
    if (stringToken) {
      const versionText = stringToken.getText();
      const version = versionText.replace(/['"]/g, '');
      if (version !== '1' && version !== '2') {
        const token = stringToken.symbol;
        const err: CustomSyntaxError = new SyntaxError(`Only rules_version '1' and '2' are allowed, but got '${version}'`);
        err.lineNumber = token.line;
        err.column = token.column + 1;
        err.index = token.start;
        throw err;
      }
    }
  }

  // Build a dummy AST with range for ESLint compatibility.
  const ast = {
    type: 'Program',
    body: [],
    tokens: [],
    comments: [],
    loc: {start: {line: 1, column: 0}, end: {line: 1, column: 0}},
    range: [0, code.length]
  };

  return {
    ast: ast,
    services: {tree: tree, code: code, parser: parser},
    visitorKeys: {Program: []}
  };
}
