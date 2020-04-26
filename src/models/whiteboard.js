import { getWhiteBoardToken, pauseWhiteBoard } from '../services/whiteboard';

export default {
  namespace: 'whiteboard',

  state: {},

  effects: {
    //获取创建白板房间所需id && token
    *getWhiteBoardToken({ payload, callback }, { call, put }) {
      const response = yield call(getWhiteBoardToken, payload);
      callback(response);
    },
    //关闭/暂停退出白板房间
    *pauseWhiteBoard({ payload, callback }, { call, put }) {
      const response = yield call(pauseWhiteBoard, payload);
      callback(response);
    }
  },
  reducers: {}
};
