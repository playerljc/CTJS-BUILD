const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const WebpackBar = require('webpackbar');
const TerserPlugin = require('terser-webpack-plugin');
const ForkTsCheckerWebpackPlugin = require('fork-ts-checker-webpack-plugin');
const Util = require('../util');
const commandArgs = require('../commandArgs');
const { getPostCssConfigPath, isDev } = require('../util');

const customArgs = commandArgs.toCommandArgs(process.argv[6]);

const runtimePath = customArgs.get('runtimepath');

const packagename = customArgs.get('packagename');

const APP_PATH = path.resolve(runtimePath, 'src'); // 项目src目录

module.exports = {
  plugins: {
    HtmlWebpackPlugin,
    MiniCssExtractPlugin,
  },
  config: {
    /**
     * 入口
     */
    entry: {
      // 判断入口文件是.js,.jsx,.tsx
      index: Util.getEntryIndex(runtimePath),
    },
    /**
     * 出口
     */
    output: {
      filename: `${packagename}.bundle.js`,
      // chunkFilename:`${packagename}.bundle.js`,
      path: path.resolve(runtimePath, 'umd'),
      publicPath: '/',
      library: `${packagename}`,
      libraryTarget: 'umd',
      libraryExport: 'default',
    },
    plugins: [
      new webpack.optimize.ModuleConcatenationPlugin(),
      // 请确保引入这个插件！
      new HtmlWebpackPlugin({
        title: '',
        filename: 'index.html',
        template: path.join(runtimePath, 'index.html'),
        hash: true, // 防止缓存
        minify: {
          removeAttributeQuotes: true, // 压缩 去掉引号
        },
        chunks: ['index'],
      }),
      // new webpack.HashedModuleIdsPlugin(),
      new MiniCssExtractPlugin({
        filename: `${packagename}.min.css`,
        // chunkFilename: `${packagename}.min.css`,
        ignoreOrder: false,
      }),
      new ForkTsCheckerWebpackPlugin({
        typescript: {
          configFile: path.join(runtimePath, 'tsconfig.json'),
          // checkSyntacticErrors: true,
        }
      }),
      new WebpackBar({ reporters: ['profile'], profile: true }),
    ],
    optimization: {
      minimize: true,
      minimizer: [new TerserPlugin(), new CssMinimizerPlugin()],
      // runtimeChunk: 'single',
      // splitChunks: {
      //   cacheGroups: {
      //     vendor: {
      //       test: /[\\/]node_modules[\\/]/,
      //       name: 'vendors',
      //       chunks: 'all',
      //     },
      //   },
      // },
    },
    module: {
      rules: [
        {
          test: /\.m?jsx?$/,
          exclude: /(node_modules|bower_components)/,
          // include: [APP_PATH],
          use: [
            'thread-loader',
            {
              loader: 'babel-loader',
              options: {
                presets: [
                  [
                    '@babel/preset-env',
                    {
                      useBuiltIns: 'entry',
                      corejs: { version: 3, proposals: true },
                    },
                    // {
                    //   useBuiltIns: 'entry',
                    // },
                  ],
                  '@babel/preset-react',
                ],
                plugins: [
                  '@babel/plugin-transform-runtime',
                  '@babel/plugin-syntax-dynamic-import',
                  '@babel/plugin-proposal-function-bind',
                  '@babel/plugin-proposal-optional-chaining',
                  ['@babel/plugin-proposal-decorators', { legacy: true }],
                  ['@babel/plugin-proposal-class-properties', { loose: false }],
                ],
                cacheDirectory: true,
              },
            },
          ],
        },
        {
          test: /\.m?tsx?$/,
          exclude: /(node_modules|bower_components)/,
          // include: [APP_PATH],
          use: [
            'thread-loader',
            {
              loader: 'ts-loader',
              options: {
                transpileOnly: true,
                happyPackMode: true,
                configFile: path.join(runtimePath, 'tsconfig.json'),
              },
            },
          ],
        },
        {
          test: /\.css$/,
          include: [APP_PATH, /highlight.js/, /photoswipe.css/, /default-skin.css/],
          use: [
            isDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: getPostCssConfigPath(runtimePath),
                },
              },
            },
          ],
        },
        {
          test: /\.less$/,
          include: [APP_PATH, /normalize.less/],
          use: [
            isDev() ? 'style-loader' : MiniCssExtractPlugin.loader,
            {
              loader: 'css-loader',
              options: {
                importLoaders: 1,
              },
            },
            {
              loader: 'postcss-loader',
              options: {
                postcssOptions: {
                  config: getPostCssConfigPath(runtimePath),
                },
              },
            },
            {
              loader: 'less-loader',
              options: {
                lessOptions: {
                  javascriptEnabled: true,
                },
              },
            },
          ],
        },
        {
          test: /\.(png|svg|jpg|gif|ico)$/,
          type: 'asset/resource',
        },
        {
          test: /\.(woff|woff2|eot|ttf|otf)$/,
          type: 'asset/resource',
        },
        {
          test: /\.(csv|tsv)$/,
          use: ['csv-loader'],
        },
        {
          test: /\.xml$/,
          use: ['xml-loader'],
        },
        {
          test: /\.ejs/,
          use: [
            {
              loader: 'ejs-loader',
              options: {
                variable: 'data',
              },
            },
          ],
        },
        {
          test: /\.ya?ml$/,
          use: ['json-loader', 'yaml-loader'],
        },
        {
          test: /\.md$/,
          use: 'raw-loader',
        },
      ],
    },
    resolve: {
      modules: [/* path.join(runtimePath, 'node_modules'), */ 'node_modules'],
      extensions: ['.js', '.jsx', '.ts', '.tsx', '.css', '.less', '.sass', '.json'], // 后缀名自动补全
    },
  },
};
