const path = require('path');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

module.exports = {
  // plugins: [
  //   new UglifyJsPlugin()
  // ],
  entry: {
    index: './src/index.js'
  },
	resolve: {
		extensions: ['.js', '.html']
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'public')
  },
  module: {
		rules: [
			{
				test: /\.html/,
				exclude: /node_modules/,
				use: {
          loader:'svelte-loader',
          options: {store:true}
        }
			}
		]
},
};
