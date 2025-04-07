const path = require("path");

module.exports = {
  webpack: function (config) {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      path: require.resolve("path-browserify"),
    };
    return config;
  },
};
