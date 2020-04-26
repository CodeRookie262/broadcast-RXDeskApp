const proxy = require('http-proxy-middleware');

module.exports = function(app) {
  app.use(
    proxy('/api', {
      target: 'http://beta.yingliboke.cn/',
      changeOrigin: true,
      pathRewrite: {
        '^/api': '/api'
      }
    })
  );

  app.use(
    proxy('/icon', {
      target: 'http://static.e-ducation.cn/favicon.ico',
      changeOrigin: true,
      pathRewrite: {
        '^/icon': ''
      }
    })
  );
  app.use(
    proxy('/baidu', {
      target: 'https://www.baidu.com/',
      changeOrigin: true,
      pathRewrite: {
        '^/baidu': ''
      }
    })
  );
};
