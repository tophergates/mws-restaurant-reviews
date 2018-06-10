const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common');

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    clientLogLevel: 'warning',
    hot: true,
    proxy: {
      "/": {
        target: 'http://localhost:1337'
      }
    }
  },
  module: {
    rules: [
      // Transform SASS into CSS
      {
        test: /\.scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
  ]
});
