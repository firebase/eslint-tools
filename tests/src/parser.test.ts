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

import assert from 'assert';
import { parseForESLint } from '../../src/parser.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

describe('FirebaseRulesParser', () => {
  it('should parse valid rules successfully', () => {
    const code =
        'rules_version = \'2\'; service cloud.firestore { match /db { allow read: if true; } }';
    assert.doesNotThrow(() => {
      parseForESLint(code);
    });
  });

  // Dynamically load all real world test cases
  const testCasesDir = path.resolve(__dirname, '../test-cases');
  let testCases: string[] = [];
  try {
    testCases = fs.readdirSync(testCasesDir).filter(f => f.endsWith('.rules'));
  } catch (e) {
    console.warn(`Could not read test cases from ${testCasesDir}`);
  }

  for (const testCase of testCases) {
    if (testCase.includes('invalid')) {
      it(`should throw on intentionally invalid rule ${testCase}`, () => {
        const code = fs.readFileSync(path.join(testCasesDir, testCase), 'utf8');
        assert.throws(() => {
          parseForESLint(code);
        });
      });
    } else {
      it(`should parse ${testCase} successfully`, () => {
        const code = fs.readFileSync(path.join(testCasesDir, testCase), 'utf8');
        assert.doesNotThrow(() => {
          parseForESLint(code);
        });
      });
    }
  }

  it('should throw SyntaxError for invalid syntax', () => {
    const code = 'rules_version = \'2\'; service { match }';  // invalid
    assert.throws(
        () => {
          parseForESLint(code);
        },
        (err) => {
          return err instanceof SyntaxError && err.message.length > 0;
        });
  });

  it('should throw SyntaxError for mismatched brace', () => {
    const code =
        'service cloud.firestore { match /db { ';  // missing closing brace
    assert.throws(() => {
      parseForESLint(code);
    }, SyntaxError);
  });

  it('should throw SyntaxError for missing ending quote', () => {
    const code =
        'rules_version = \'2; service cloud.firestore { match /db { allow read: if true; } }';  // missing ending quote
    assert.throws(() => {
      parseForESLint(code);
    }, SyntaxError);
  });

  it('should throw SyntaxError for missing if statement identifier', () => {
    const code =
        'service cloud.firestore { match /db { allow read: if; } }';  // missing
                                                                      // condition
    assert.throws(() => {
      parseForESLint(code);
    }, SyntaxError);
  });

  it('should throw SyntaxError for invalid rules_version', () => {
    const code =
        'rules_version = \'3\'; service cloud.firestore { match /db { allow read: if true; } }';
    assert.throws(
        () => {
          parseForESLint(code);
        },
        (err: any) => {
          return err instanceof SyntaxError && err.message.includes("Only rules_version '1' and '2' are allowed");
        });
  });
});
