let config = null;

// module.hot will be true in development and false in production
if (module.hot) {
  config = require('./config.dev').default;
  config.MODE = 'development';
}
else {
  // import config.prod.js and export it
  config = require('./config.prod').default;
  config.MODE = 'production';
}

export default config;
