const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Configurar fallbacks para polyfills do Node.js
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        http: false,
        https: false,
        stream: require.resolve("stream-browserify"),
        zlib: require.resolve("browserify-zlib"),
        util: require.resolve("util/"),
        url: require.resolve("url/"),
        crypto: require.resolve("crypto-browserify"),
        assert: require.resolve("assert/"),
        buffer: require.resolve("buffer/"),
        process: require.resolve("process/browser.js"),
        os: false,
        fs: false,
        net: false,
        tls: false
      };

      // Adicionar plugins para prover variáveis globais (SEM process.env para evitar conflito)
      webpackConfig.plugins.push(
        new webpack.DefinePlugin({
          global: 'globalThis',
        }),
        new webpack.ProvidePlugin({
          process: 'process/browser.js',
          Buffer: ['buffer', 'Buffer'],
        })
      );

      // Ignorar warnings de source maps faltando
      webpackConfig.ignoreWarnings = [
        ...(webpackConfig.ignoreWarnings || []),
        /Failed to parse source map/,
        /Critical dependency: the request of a dependency is an expression/
      ];

      return webpackConfig;
    }
  }
}; 