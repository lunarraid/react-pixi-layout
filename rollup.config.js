import babel from '@rollup/plugin-babel';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import commonjs from '@rollup/plugin-commonjs';

export default {
  external: [ 'typeflex', 'react-reconciler', 'pixi.js', 'react', 'react-dom' ],
  input: 'src/index.js',
  output: [
    {
      file: 'dist/cjs/index.js',
      format: 'cjs',
      sourcemap: true
    },
    {
      file: 'dist/esm/index.js',
      format: 'esm',
      sourcemap: true
    }
  ],
  plugins: [
    babel({
      babelHelpers: 'bundled',
      exclude: 'node_modules/**'
    }),
    commonjs(),
    nodeResolve({ preferBuiltins: false }),
    terser()
  ]
};
