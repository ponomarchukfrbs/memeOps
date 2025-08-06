const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CopyPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: './public/src/script.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          MiniCssExtractPlugin.loader,
          'css-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
      filename: 'index.html',
      title: 'memeOps - IT memes',
      inject: 'body',
    }),
    new HtmlWebpackPlugin({
      template: './public/404.html',
      filename: '404.html',
      title: 'memeOps - Not found',
      inject: 'body',
    }),
    new MiniCssExtractPlugin({
      filename: 'style.css',
    }),
    new CopyPlugin({
      patterns: [
        {
          from: 'public', to: '.',
          globOptions: {
            ignore: [
              '**/index.html',
              '**/404.html',
              '**/style.css',
              '**/src/**'
            ],
          },
        },
      ],
    }),
  ],
  devtool: 'eval-source-map',
};
