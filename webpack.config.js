const path = require('path');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const HtmlWebPackPlugin = require("html-webpack-plugin");

module.exports = {
  // entry: './src/nas-101/index.js',
  entry: './src/index.js',
  watch: true,
  
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist')
  },

  module: {
    rules: [
      {
        test: /\.(glsl|vs|fs)$/,
        loader: 'shader-loader',
      },{
        test: /\.css$/,
        use: [
          'style-loader',
          'css-loader'
        ]
      }
    ],
  },

  devtool: 'inline-source-map',

  plugins: [
    new CopyWebpackPlugin([
      { from: 'static' }
    ]),
    new HtmlWebPackPlugin({
      template: "./src/index.html",
      filename: "./index.html"
    }),
  ]
    
};
