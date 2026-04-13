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

import { TSESLint, AST_NODE_TYPES } from '@typescript-eslint/utils';

import rule from '../../../src/rules/no-redundant-matches.js';
import * as parser from '../../../src/parser.js';
import { RuleTester } from '@typescript-eslint/rule-tester';

RuleTester.afterAll = after;
const ruleTester = new RuleTester({ languageOptions: { parser } });

ruleTester.run('no-redundant-matches', rule, {
  valid: [{
    filename: 'test.firestore.rules',
    code:
        'service cloud.firestore { match /databases/{db}/documents { match /users/{userId} { allow read: if false; } match /posts/{postId} { allow read: if false; } } }'
  }],

  invalid: [{
    filename: 'test.firestore.rules',
    code:
        'service cloud.firestore { match /databases/{db}/documents { match /users/{userId} { allow read: if false; } match /users/{otherId} { allow read: if false; } } }',
    errors: [{
      messageId: 'redundantMatch',
      type: AST_NODE_TYPES.Program
    }]
  }]
});
