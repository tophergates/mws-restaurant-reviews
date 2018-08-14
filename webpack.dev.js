const webpack = require('webpack');
const merge = require('webpack-merge');
const common = require('./webpack.common');
const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

module.exports = merge(common, {
  mode: 'development',
  devServer: {
    clientLogLevel: 'warning',
    hot: true
  },
  module: {
    rules: [
      // Transform SASS into CSS
      {
        test: /\.css|scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new BundleAnalyzerPlugin({
      analyzerPort: 8081
    })
  ]
});
