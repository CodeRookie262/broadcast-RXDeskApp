import { getCaptcha, login } from '../services/login.js';
import { message } from 'antd';
import axios from 'axios';

message.config({ maxCount: 1 });
const { ipcRenderer } = window.electron;

export default {
  namespace: 'login',
  state: {
    loadingCaptcha: false,
    loadingLogin: false
  },
  effects: {
    *getCaptcha({ payload, callback, failCallback }, { call, put }) {
      yield put({
        type: 'CaptchaLoading',
        payload: true
      });
      const response = yield call(getCaptcha, payload);
      if (response.code === 20000) {
        message.success('验证码发送成功，请注意查收！');
        callback(response);
      } else if (response.code === 20012) {
        message.error('用户不存在');
        failCallback();
      } else if (response.code === 20017) {
        message.error('验证码发送类型错误');
        failCallback();
      } else {
        message.error('验证码发送失败');
        failCallback();
      }
      yield put({
        type: 'CaptchaLoading',
        payload: false
      });
    },
    *login({ payload, callback }, { call, put }) {
      yield put({
        type: 'LoginLoading',
        payload: true
      });
      const response = yield call(login, payload);
      yield put({
        type: 'LoginLoading',
        payload: false
      });

      if (response.code === 20000) {
        ipcRenderer.send('login');

        if (localStorage.getItem('room-id') !== response.room_id) {
          localStorage.removeItem('current_courseware_id');
        }
        localStorage.setItem('room-id', response.room_id);
        localStorage.setItem('token', response.token);
        axios.defaults.headers.common[
          'Authorization'
        ] = `JWT ${response.token}`;
        window.location.hash = 'deviceProbing';
      } else if (response.code === 20017) {
        message.error('验证码格式错误');
      } else if (response.code === 20023) {
        message.error('验证码错误');
      } else if (response.code === 20024) {
        message.error('你无权访问该直播间');
      } else if (response.code === 20026) {
        message.error('请输入正确的房间号格式');
      } else if (response.code === 20013) {
        message.error('密码错误	');
      } else if (
        response.code === 20030 ||
        response.code === 30016 ||
        response.code === 20038
      ) {
        callback(response);
      } else {
        message.error('登录失败');
      }
    }
  },
  reducers: {
    CaptchaLoading(state, action) {
      return {
        ...state,
        loadingCaptcha: action.payload
      };
    },
    LoginLoading(state, action) {
      return {
        ...state,
        loadingLogin: action.payload
      };
    }
  }
};
