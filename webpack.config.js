const path = require('path');
const webpack = require("webpack");
const TerserPlugin = require('terser-webpack-plugin');

module.exports = (env, argv) => ({
  entry: './js/wasm-ar-lib.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: argv.mode == 'development' ? 'wasm-ar.js' : 'wasm-ar.min.js',
    library: 'WasmAR',
    libraryTarget: 'umd',
    globalObject: 'typeof self !== \'undefined\' ? self : this',
  },
  mode: argv.mode == 'development' ? 'development' : 'production',
  devtool: argv.mode == 'development' ? 'source-map' : undefined,
  module: {
    rules: [
      {
        test: /\.js?$/,
        exclude: /node_modules/,
        use: [{
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-env'],
            plugins: [
              ['@babel/transform-runtime']
            ]
          }
        }]
      },
      {
        test: /\.glsl$/i,
        use: [
          {
            loader: path.resolve('webpack-glsl-minifier.js'),
          }
        ],
      },
    ],
  },
  mode: argv.mode == 'development' ? 'development' : 'production',
  devtool: argv.mode == 'development' ? 'source-map' : undefined,
  devServer: {
      host: 'localhost',
      port: 8000,
      contentBase: __dirname
  },
  optimization: argv.mode == 'development' ? { minimize: false } : {
      minimizer: [new TerserPlugin({
          terserOptions: {
              compress: {
                  defaults: true,
              },
              mangle: true,
          },
          extractComments: false,
      })],
      minimize: true,
  },
  resolve: {
    extensions: ['.js']
  },
  node: {
    'fs': 'empty'
  }
});
