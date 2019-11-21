import babel from 'rollup-plugin-babel';
import nodebuiltins from 'rollup-plugin-node-builtins';
import commonjs from 'rollup-plugin-commonjs';
import external from 'rollup-plugin-peer-deps-external';
import resolve from 'rollup-plugin-node-resolve';

import pkg from './package.json';

export default {
  external: [ 'lodash', 'yoga-layout' ],
  input: 'src/index.js',
  output: [
    {
      file: pkg.main,
      format: 'cjs'
    },
    {
      file: pkg.module,
      format: 'es'
    }
  ],
  plugins: [
    external(),
    nodebuiltins(),
    babel({ exclude: 'node_modules/**' }),
    resolve(),
    commonjs()
  ]
};
