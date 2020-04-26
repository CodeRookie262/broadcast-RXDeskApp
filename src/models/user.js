import { getUserInfo, updateUserInfo } from '@/services/user.js';
import { message } from 'antd';

const zego = window.zego;

export default {
  namespace: 'user',
  state: {
    loading: true,
    userVisible_props: false
  },
  effects: {
    *getUserInfo({ payload, callback }, { call, put }) {
      yield put({ type: 'changeLoading', loading: true });
      const res = yield call(getUserInfo);
      yield put({ type: 'changeLoading', loading: false });
      if (res.code === 20000) {
        callback(res.data);
        yield put({ type: 'saveUserInfo', data: res.data });
      }
    },
    *updateUserInfo({ payload, callback }, { call, put }) {
      // console.log(payload);
      const res = yield call(updateUserInfo, payload);
      if (res.code === 20000) {
        yield put({ type: 'saveUserInfo', data: res.data });
        callback(res.data);
      } else if (res.code === 20027) {
        message.error('用户昵称格式不正确');
      } else if (res.code === 20028) {
        message.error('用户简介过长	');
      } else {
        message.error('保存失败');
      }
    }
  },
  reducers: {
    changeLoading(state, payload) {
      return {
        ...state,
        loading: payload.loading
      };
    },
    saveUserInfo(state, payload) {
      return {
        ...state,
        ...payload.data
      };
    },
    userVisible(state, payload) {
      return {
        ...state,
        userVisible_props: payload.visible
      };
    }
  }
};
