/**
 * Webpack Configuration for Survey SPA
 * 
 * Creates a self-contained single-file bundle for React Native WebView consumption
 * Includes all dependencies: React, SurveyJS, Ford Design System, custom questions/renderers
 */

const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const InlineChunkHtmlPlugin = require('react-dev-utils/InlineChunkHtmlPlugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = {
  mode: 'production',
  
  entry: path.resolve(__dirname, './main.tsx'),
  
  output: {
    filename: 'survey-spa.js',
    path: path.resolve(__dirname, '../../dist/survey-spa'),
    clean: true,
    publicPath: '',
  },

  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.json'],
    alias: {
      // Alias for shared types
      '@meridian-event-tech/shared': path.resolve(__dirname, '../../../shared/src'),
      // Ford UI aliases (matching tsconfig.json)
      '@ui/ford-ui-components': path.resolve(__dirname, '../../../ford-ui/packages/@ui/ford-ui-components'),
      '@ui/atoms': path.resolve(__dirname, '../../../ford-ui/packages/@ui/atoms/src/lib'),
      '@ui/icons': path.resolve(__dirname, '../../../ford-ui/packages/@ui/icons/src/lib'),
      '@common/helpers': path.resolve(__dirname, '../../../ford-ui/packages/@common/helpers/src/lib'),
      '@common/interfaces': path.resolve(__dirname, '../../../ford-ui/packages/@common/interfaces/src/lib'),
      '@common/utils': path.resolve(__dirname, '../../../ford-ui/packages/@common/utils/src/lib'),
    },
  },

  module: {
    rules: [
      // TypeScript and React
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              transpileOnly: true,
              configFile: path.resolve(__dirname, '../../tsconfig.json'),
            },
          },
        ],
      },

      // JavaScript and JSX
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                ['@babel/preset-env', { targets: 'defaults' }],
                ['@babel/preset-react', { runtime: 'automatic' }],
                '@babel/preset-typescript',
              ],
            },
          },
        ],
      },

      // CSS processing - inline everything for single file output
      {
        test: /\.css$/,
        use: [
          'style-loader', // Inject CSS into DOM
          'css-loader',   // Process CSS imports
        ],
      },

      // SCSS processing
      {
        test: /\.scss$/,
        use: [
          'style-loader',
          'css-loader',
          'sass-loader',
        ],
      },

      // Font handling - base64 embed for offline usage
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/inline', // Converts to base64 data URLs
      },

      // Image handling - base64 embed small images
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        type: 'asset',
        parser: {
          dataUrlCondition: {
            maxSize: 100 * 1024, // 100kb - embed smaller images
          },
        },
      },

      // Handle other assets
      {
        test: /\.(ico|pdf|txt)$/,
        type: 'asset/resource',
      },
    ],
  },

  plugins: [
    // Generate HTML file
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, './index.html'),
      filename: 'index.html',
      inject: 'body',
      minify: {
        removeComments: true,
        collapseWhitespace: true,
        removeRedundantAttributes: true,
        useShortDoctype: true,
        removeEmptyAttributes: true,
        removeStyleLinkTypeAttributes: true,
        keepClosingSlash: true,
        minifyJS: true,
        minifyCSS: true,
        minifyURLs: true,
      },
    }),

    // Inline all chunks into HTML for single-file output
    new InlineChunkHtmlPlugin(HtmlWebpackPlugin, [/.*/]),
  ],

  optimization: {
    minimize: true,
    splitChunks: false, // Don't split chunks - keep everything in one bundle
  },

  // Performance hints for mobile app constraints
  performance: {
    maxAssetSize: 5 * 1024 * 1024, // 5MB limit for mobile
    maxEntrypointSize: 5 * 1024 * 1024,
    hints: 'warning',
  },

  // Development settings for debugging
  devtool: process.env.NODE_ENV === 'development' ? 'source-map' : false,

  // Ignore warnings for large bundles (expected for SPA)
  ignoreWarnings: [
    {
      module: /survey-core/,
    },
    {
      module: /survey-react-ui/,
    },
  ],

  externals: {
    // Don't bundle these if they're available globally (they won't be in our case)
    // This is here for future optimization if needed
  },

  stats: {
    assets: true,
    chunks: true,
    modules: false,
    reasons: false,
    errorDetails: true,
    warnings: true,
  },
};
