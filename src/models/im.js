import {
  getUserList,
  IMBanned,
  getAllUser,
  submitUserChat
} from '../services/im.js';
import { message } from 'antd';

export default {
  namespace: 'im',
  state: {
    currentUserList: {},
    onlineUser: 1
  },
  effects: {
    *getUserList({ payload, callback }, { call, put }) {
      // 带marker获取成员列表(为成员列表)
      const response = yield call(getUserList, payload);
      // console.log('response:', response);
      if (response.code === 20000) {
        callback(response.data);
      }
    },
    *getAllUser({ payload, callback }, { call, put }) {
      // 获取全部成员列表（为禁言）
      const response = yield call(getAllUser, payload);
      // console.log('response:', response);
      if (response.code === 20000) {
        yield put({
          type: 'userList',
          data: response.data
        });
      }
    },
    *submitUserChat({ payload }, { call }) {
      // 提交聊天记录消息
      const response = yield call(submitUserChat, payload);
      console.log('聊天记录提交response---', response);
    }
  },
  reducers: {
    userList(state, payload) {
      return {
        ...state,
        currentUserList: payload.data
      };
    },
    online(state, payload) {
      return {
        ...state,
        onlineUser: payload.payload
      };
    }
  }
};
