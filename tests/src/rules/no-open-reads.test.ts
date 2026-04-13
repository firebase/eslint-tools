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

import { AST_NODE_TYPES } from '@typescript-eslint/utils';
import * as parser from '../../../src/parser.js';
import rule from '../../../src/rules/no-open-reads.js';
import { RuleTester } from '@typescript-eslint/rule-tester';

RuleTester.afterAll = after;
const ruleTester = new RuleTester({ languageOptions: { parser } });

ruleTester.run('no-open-reads', rule, {
  valid: [
    {
      filename: 'test.firestore.rules',
      code:
          'rules_version = \'2\'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read: if request.auth != null; } } }'
    },
    {
      filename: 'test.firestore.rules',
      code:
          'service firebase.storage { match /b/{bucket}/o { match /{allPaths=**} { allow write: if true; } } }' // Valid for read rule
    }
  ],

  invalid: [
    {
      filename: 'test.firestore.rules',
      code:
          'rules_version = \'2\'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read: if true; } } }',
      errors: [{
        messageId: 'openRead',
        type: AST_NODE_TYPES.Program
      }]
    },
    {
      filename: 'test.firestore.rules',
      code:
          'rules_version = \'2\'; service cloud.firestore { match /databases/{database}/documents { match /{document=**} { allow read, write: if true; } } }',
      errors: [{
        messageId: 'openRead',
        type: AST_NODE_TYPES.Program
      }]
    }
  ]
});
