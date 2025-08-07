const path = require("path");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");

module.exports = (env, argv) => {
  const isProduction = argv.mode === "production";

  return {
    entry: "../assets/js/src/index.js",
    output: {
      path: path.resolve(__dirname, "../assets/js/dist"),
      filename: "form-widget.js",
      library: {
        name: "MoneyBagPricingForm",
        type: "window",
      },
      clean: true,
    },
    externals: {
      react: "React",
      "react-dom": "ReactDOM",
    },
    module: {
      rules: [
        {
          test: /\.jsx?$/,
          exclude: /node_modules/,
          use: {
            loader: "babel-loader",
            options: {
              presets: ["@babel/preset-env", "@babel/preset-react"],
            },
          },
        },
        {
          test: /\.s[ac]ss$/i,
          use: [MiniCssExtractPlugin.loader, "css-loader", "sass-loader"],
        },
      ],
    },
    plugins: [
      new MiniCssExtractPlugin({
        filename: "form-widget.css",
      }),
    ],
    resolve: {
      extensions: [".js", ".jsx"],
    },
    devtool: isProduction ? false : "source-map",
    optimization: {
      minimize: isProduction,
    },
  };
};
