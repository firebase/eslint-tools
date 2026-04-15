import assert from 'assert';
import { createRequire } from 'module';
import path from 'path';
import { fileURLToPath } from 'url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

describe('Package Imports', () => {
  const distDir = path.resolve(__dirname, '../../dist');

  it('should load ESM build correctly', async () => {
    const esmPath = path.resolve(distDir, 'index.js');
    const module = await import(esmPath);
    
    assert.ok(module.default, 'Default export should exist');
    assert.ok(module.rules, 'Named export "rules" should exist');
    assert.ok(module.flatRecommended, 'Named export "flatRecommended" should exist');
    
    assert.strictEqual(module.default.meta.name, '@firebase/eslint-plugin-security-rules');
  });

  it('should load CJS build correctly', () => {
    const cjsPath = path.resolve(distDir, 'index.cjs');
    const module = require(cjsPath);
    
    // Check if it has default or if it's directly the object
    const instance = module.default || module;
    
    assert.ok(instance.rules, 'Rules should exist in CJS');
    assert.strictEqual(instance.meta.name, '@firebase/eslint-plugin-security-rules');
  });

  it('should load parser separately via ESM', async () => {
    const parserPath = path.resolve(distDir, 'parser.js');
    const module = await import(parserPath);
    assert.ok(module.parseForESLint, 'parseForESLint should exist');
  });

  it('should load parser separately via CJS', () => {
    const parserPath = path.resolve(distDir, 'parser.cjs');
    const module = require(parserPath);
    
    const instance = module.default || module;
    assert.ok(instance.parseForESLint, 'parseForESLint should exist in CJS');
  });
});
