const path = require('path');
const uglifyJS = require('uglify-es');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

const minifyHtmlOptions = {
  html5: true,
  collapseWhitespace: true,
  minifyCSS: true,
  minifyJS: true,
  minifyURLs: false,
  removeAttributeQuotes: false,
  removeComments: true,
  removeEmptyAttributes: true,
  removeOptionalTags: true,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: true,
  removeStyleLinkTypeAttributes: true,
  useShortDoctype: true
};

module.exports ={
  entry: {
    app: './src/index.js'
  },
  output: {
    filename: './js/[name].min.js',
    path: path.resolve(__dirname, 'dist')
  },
  devtool: 'source-map',
  module: {
    rules: [
      // Transpile modern JS into ES5 using Babel
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: ['babel-loader']
      },

      // Enables loading image files
      {
        test: /\.(png|svg|jpg|gif)$/,
        use:['file-loader']
      }
    ]
  },
  plugins: [
    // Clean the dist folder
    new CleanWebpackPlugin('dist'),

    // Generate HTML files (index.html and restaurant.html)
    new HtmlWebpackPlugin({
      title: 'Restaurant Reviews',
      favicon: 'src/public/favicon.ico',
      template: 'src/public/index.html',
      minify: minifyHtmlOptions
    }),
    new HtmlWebpackPlugin({
      title: 'Restaurant Info',
      favicon: 'src/public/favicon.ico',
      filename: 'restaurant.html',
      template: 'src/public/restaurant.html',
      minify: minifyHtmlOptions
    }),

    // Copy static files to dist
    new CopyWebpackPlugin([
      { from: 'src/public/data', to: './data' },
      { from: 'src/public/images', to: './images' },
      { from: 'src/public/manifest.json' },
      { from: 'src/public/favicon-16x16.png'},
      { from: 'src/public/favicon-32x32.png'},
      { 
        from: 'src/public/sw.js',
        transform: function(fileContent, filePath) {
          return uglifyJS.minify(fileContent.toString()).code.toString();
        }
      },
    ])
  ]
}