import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', 'src/parser.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  cjsInterop: true
});
