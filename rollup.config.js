import { defineConfig } from 'rollup';
import typescript from '@rollup/plugin-typescript';
import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import { readFileSync } from 'fs';
import { join } from 'path';

const isProduction = process.env.NODE_ENV === 'production';

// 读取并解析package.json
const pkgPath = join(process.cwd(), 'package.json');
const pkg = JSON.parse(readFileSync(pkgPath, 'utf8'));

export default defineConfig([
  {
    input: 'src/index.ts',
    output: [
      // CommonJS (CJS) 格式，供 Node.js 和旧版打包工具使用
      {
        file: pkg.main,
        format: 'cjs',
        sourcemap: true,
        exports: 'named', // 确保所有导出都作为具名导出处理，避免 chunk.default 警告
      },
      // ES Module (ESM) 格式，供现代打包工具使用
      {
        file: pkg.module,
        format: 'esm',
        sourcemap: true,
      },
    ],
    external: [...Object.keys(pkg.dependencies || {}), ...Object.keys(pkg.peerDependencies || {})],
    plugins: [
      resolve(), // so Rollup can find `ms`
      commonjs(), // so Rollup can convert `ms` to an ES module
      typescript({
        tsconfig: './tsconfig.json',
        sourceMap: true,
        inlineSources: true,
      }), // so Rollup can convert TypeScript to JavaScript
      terser(), // 压缩代码
    ],
  },
]);
