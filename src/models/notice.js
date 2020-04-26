import { createNotice, deleteNotice, getNotice } from '../services/notice.js';
import { message } from 'antd';

export default {
  namespace: 'notice',
  state: {
    currentNotice: {},
    createloading: false,
    deleteloading: false
  },
  effects: {
    *createNotice({ payload, callback }, { call, put }) {
      yield put({
        type: 'createLoading',
        payload: true
      });
      const response = yield call(createNotice, payload);
      yield put({
        type: 'createLoading',
        payload: false
      });
      // console.log('notice:', response);
      if (response.code === 20000) {
        // message.success('公告发布成功');
        yield put({
          type: 'saveNotice',
          payload: response.data
        });
        callback(response);
      } else if (response.code === 41002) {
        message.error('参数不全，请补充完全');
      } else if (response.code === 41001) {
        message.error('发布公告失败');
      } else {
        message.error('操作失败');
      }
    },
    *deleteNotice({ payload, callback }, { call, put }) {
      yield put({
        type: 'deleteLoading',
        payload: true
      });
      const response = yield call(deleteNotice, payload);
      yield put({
        type: 'deleteLoading',
        payload: false
      });
      // console.log('delete:', response);
      if (response.code === 20000) {
        // message.success('删除公告成功');
        yield put({
          type: 'saveNotice',
          payload: {}
        });
        callback(response);
      } else if (response.code === 41003) {
        message.error('删除公告失败');
      } else if (response.code === 41004) {
        message.error('公告不存在');
      } else {
        message.error('操作失败');
      }
    },
    *getNotice({ payload, callback }, { call, put }) {
      const response = yield call(getNotice, payload);
      if (response.code === 20000) {
        yield put({
          type: 'saveNotice',
          payload: response.data
        });
      }
    }
  },
  reducers: {
    saveNotice(state, action) {
      return { ...state, currentNotice: action.payload };
    },
    createLoading(state, action) {
      return { ...state, createloading: action.payload };
    },
    deleteLoading(state, action) {
      return { ...state, deleteloading: action.payload };
    }
  }
};
