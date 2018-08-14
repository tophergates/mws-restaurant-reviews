const merge = require('webpack-merge');
const common = require('./webpack.common');
// const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: './js/[name].min.js'
  },
  module: {
    rules: [
      // Extract SASS to CSS file
      // {
      //   test: /\.css|scss$/,
      //   use: ExtractTextPlugin.extract({
      //     fallback: 'style-loader',
      //     use: [
      //       {
      //         loader: 'css-loader',
      //         options: { minimize: true }
      //       },
      //       {
      //         loader: 'sass-loader'
      //       }
      //     ]
      //   })
      // },
      {
        test: /\.css|scss$/,
        use: ['style-loader', 'css-loader', 'sass-loader']
      }
    ]
  },
  optimization: {
    nodeEnv: 'production',
    minimize: true
  },
  plugins: [
    // Extract CSS file to style.css
    // new ExtractTextPlugin('./css/style.min.css'),
  ]
});
