const path = require("path");
const webpack = require("webpack");
const SingleEntryPlugin = require(`./node_modules/webpack/lib/SingleEntryPlugin`);
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const config = {
  target: "web",
  context: __dirname,
  entry: {
    app: "./app/index.js"
  },
  cache: true,
  devtool: "source-map",
  mode: "development",
  optimization: { runtimeChunk: true },

  module: {
    rules: [
      {
        test: /\.css/,
        use: ExtractTextPlugin.extract({
          fallback: "style-loader",
          use: "css-loader?sourceMap"
        })
      }
    ]
  },

  plugins: [new ExtractTextPlugin("styles.[hash].css")],

  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "[name].[chunkhash].js",
    chunkFilename: "[name].[chunkhash].js"
  }
};

const compiler = webpack(config);
compiler.plugin("make", (compilation, callback) => {
  const childCompiler = compilation.createChildCompiler(
    "my-child-compiler",
    {},
    [
      // new ExtractTextPlugin("styles2.[hash].css"),
      new SingleEntryPlugin(
        compiler.context,
        "./app/index.js",
        "child-compilation-chunk"
      )
    ]
  );

  childCompiler.runAsChild((err, entries, childCompilation) => {
    callback(err);
  });
});

function concatChildProps(parent, property) {
  let children = parent.children || [];
  let childProps = children.map(c => concatChildProps(c, property));
  return Array.prototype.concat.apply(parent[property] || [], childProps);
}

const watching = compiler.watch(
  {
    aggregateTimeout: 300,
    poll: 1000
  },
  (err, stats) => {
    console.log(
      "Done!",
      err,
      stats.hasErrors(),
      stats.hasWarnings(),
      concatChildProps(stats.toJson(), "errors")
    );
    stopCompilation();
  }
);

const stopCompilation = err => {
  watching.close(() => {
    console.log("finished watching");
  });
};
