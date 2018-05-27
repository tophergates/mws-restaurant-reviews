const merge = require('webpack-merge');
const common = require('./webpack.common');
const ExtractTextPlugin = require('extract-text-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  output: {
    chunkFilename: './js/[name].min.js',
  },
  module: {
    rules: [
      // Extract SASS to CSS file
      {
        // exclude: /\.useable\.scss$/,
        test: /\.scss$/,
        use: ExtractTextPlugin.extract({
          fallback: { loader: 'style-loader' },
          use: [
            {
              loader: 'css-loader',
              options: { minimize: true }
            },
            {
              loader: 'sass-loader'
            }
          ]
        })
      },
      // {
      //   test: /\.useable\.scss$/,
      //   use: ['style-loader/useable', 'css-loader', 'sass-loader']
      // },
    ]
  },
  plugins: [
    // Extract CSS file to style.css
    new ExtractTextPlugin({ 
      filename: './css/style.min.css', 
      allChunks: false,
    })
  ]
});
