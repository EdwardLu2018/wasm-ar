const path = require('path');

module.exports = (env, argv) => ({
  entry: './js/index.js',
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
  devServer: {
      host: 'localhost',
      port: 8000,
      static: __dirname
  },
  resolve: {
    extensions: ['.js']
  },
});
