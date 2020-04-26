import React from 'react';
import dva from 'dva';
import Router from './Router';
import { createHashHistory } from 'history';
import * as serviceWorker from './serviceWorker';
import './index.css';

// 创建应用
const app = new dva({
  history: createHashHistory()
});

// models
require('./models').default.forEach(key => {
  app.model(key.default);
});

// 注册路由表
app.router(history => <Router history={history} />);

// 启动应用
app.start('#root');

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
