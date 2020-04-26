import request from '../utils/request.js';

// 获取验证码
export function getCaptcha(data) {
  return request({
    url: '/api/captcha/',
    method: 'POST',
    data
  });
}

// 登录
export function login(data) {
  return request({
    url: '/api/liveroomlogin/login/',
    method: 'POST',
    data
  });
}
