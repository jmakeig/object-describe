import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
// import replace from 'rollup-plugin-replace';

const plugins = [
  // replace({
  //   'process.env.NODE_ENV': JSON.stringify('development')
  // }),
  nodeResolve({}),
  commonjs({
    include: 'node_modules/**'
  })
];
export default [
  {
    //input: 'src/describe.js',
    input: 'docs/example.js',
    output: {
      file: 'docs/bundle.js',
      format: 'iife',
      name: 'describe',
      sourcemap: true
    },
    plugins
  },
  {
    input: 'src/describe.js',
    output: {
      file: 'marklogic-describe/public/js/describe.js',
      format: 'iife',
      name: 'describe'
    },
    plugins
  },
  {
    input: 'src/render.js',
    output: {
      file: 'marklogic-describe/public/js/render.js',
      format: 'iife',
      name: 'render'
    },
    plugins
  },
  {
    //input: 'src/describe.js',
    input: 'test/index.js',
    output: {
      file: 'dist/tests.js',
      format: 'iife',
      name: 'tests',
      sourcemap: 'inline'
    },
    plugins
  }
];
