import axios from 'axios';
import React from 'react';
import { message, notification, Icon } from 'antd';

const codeMessage = {
  400: '发出的请求有错误，服务器没有进行新建或修改数据的操作',
  401: '用户没有权限（令牌、用户名、密码错误）',
  403: '用户得到授权，但是访问是被禁止的',
  404: '发出的请求针对的是不存在的记录，服务器没有进行操作',
  406: '请求的格式不正确',
  410: '请求的资源被永久删除，且不会再得到的',
  422: '当创建一个对象时，发生一个验证错误',
  500: '服务器发生错误，请检查服务器',
  502: '网关错误',
  503: '服务不可用，服务器暂时过载或维护',
  504: '网关超时'
};

// 异常处理程序
axios.interceptors.response.use(
  response => {
    let res = (response && response.data) || '';
    switch (res && res.code) {
      case 20018:
        message.error('token过期，请重新获取', 1);
        return false;

      default:
        return response.data;
    }
  },
  error => {
    if (error.response) {
      const {
        status,
        config: { url }
      } = error.response;
      if (codeMessage[status]) {
        notification.error({
          message: `请求错误 ${status}: ${url}`,
          description: codeMessage[status]
        });
        return false;
      }
      return Promise.reject(error);
    } else {
      return error;
    }
  }
);

let token = localStorage.getItem('token');
// 默认header
axios.defaults.headers.common['Authorization'] = `JWT ${(token && token) ||
  ''}`;
axios.defaults.headers.Accept = 'application/json';
axios.defaults.headers.post['Content-Type'] =
  'application/x-www-form-urlencoded';
axios.defaults.headers.common['Cache-Control'] = 'no-cache';
axios.defaults.headers.common['Platform'] = 'DESKTOP';
// 打包后的axios配置
const host =
  process.env.NODE_ENV === 'development' ? '' : 'http://beta.yingliboke.cn/';

export default function request(obj) {
  let { url, method, data } = obj;
  return axios({
    url: host + url,
    method,
    data
  });
}
