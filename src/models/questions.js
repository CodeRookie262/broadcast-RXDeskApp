import { changeQuestion, getQuestion, Answer } from '../services/questions';
import { message } from 'antd';

export default {
  namespace: 'questions',
  state: {
    tabsStatus: 1,
    list: []
  },
  effects: {
    *putStatus({ payload, callback }, { call, put }) {
      // 开启/关闭问答
      const response = yield call(changeQuestion, payload);
      if (response.code === 20000) {
        yield put({
          type: 'changeTabs',
          payload: payload.change_status
        });
        callback(response);
      } else {
        message.error(response.msg);
      }
    },
    *getQuestion({ payload, callback }, { call, put }) {
      // 获取问答列表及详情接口
      const response = yield call(getQuestion, payload);
      if (response.code === 20000) {
        callback(response.data);
        yield put({
          type: 'saveQuestion',
          payload: response.data
        });
      } else {
        message.error(response.msg);
      }
    },
    *Answer({ payload, callback }, { call, put }) {
      // 获取问答列表及详情接口
      const response = yield call(Answer, payload);
      if (response.code === 20000) {
        console.log('问答提问成功');
        callback(response);
      } else {
        console.log('问答提问失败');
      }
    }
  },
  reducers: {
    changeTabs(state, payload) {
      return {
        ...state,
        tabsStatus: payload.payload
      };
    },
    saveQuestion(state, payload) {
      return {
        ...state,
        list: payload.payload
      };
    }
  }
};
