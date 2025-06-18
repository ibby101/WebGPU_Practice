const path = require('path');

module.exports = {
  entry: './src/main.ts',
  mode: 'development',
  devtool: 'source-map',
  devServer: {
    static: './public',
    hot: true,
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.wgsl$/,
        exclude: /node_modules/,
        use: 'raw-loader'
      }
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  }
};
