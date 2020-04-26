import {
  getWhiteBoardToken,
  pauseWhiteBoard,
  checkOnLine
} from '../services/whiteboard';

export default {
  namespace: 'common',
  state: {
    contentKey: null,
    playDemoId: '',
    offVideo: true,
    sameId: false,
    lineStatus: 1,
    count: 0,
    current_camera_id: null
  },

  effects: {
    //获取创建白板房间所需id && token
    *getWhiteBoardToken({ payload, callback }, { call, put }) {
      const response = yield call(getWhiteBoardToken, payload);
      callback(response);
    },
    //暂停或退出白板房间
    *pauseWhiteBoard({ payload, callback }, { call, put }) {
      const response = yield call(pauseWhiteBoard, payload);
      callback(response);
    },
    *checkOnLine({ payload, callback }, { call, put, select }) {
      let res;
      if (payload === 'elite') {
        const lineStatus = yield select(state => state.common.lineStatus);
        res = yield call(checkOnLine, 'elite');
        if (res && res.status && res.status === 200 && lineStatus === 504) {
          yield put({ type: 'saveLineStatus', data: res.status });
        }
        if (res && !res.status) {
          yield put({ type: 'saveLineStatus', data: 504 });
        }
      } else if (payload === 'baidu') {
        res = yield call(checkOnLine, 'baidu');
        if (res && res.status && res.status === 504) {
          yield put({ type: 'saveLineStatus', data: res.status });
        }
        if (res && !res.status) {
          yield put({ type: 'saveLineStatus', data: 504 });
        }
      }
      callback(res);
    }
  },
  reducers: {
    saveLineStatus(state, action) {
      return {
        ...state,
        lineStatus: action.data
      };
    },
    showPanel(state, action) {
      return {
        ...state,
        contentKey: action.payload
      };
    },
    changePlayDemoId(state, action) {
      return {
        ...state,
        playDemoId: action.payload
      };
    },
    sameId(state, action) {
      return {
        ...state,
        sameId: action.payload
      };
    },
    offVideo(state, action) {
      return {
        ...state,
        offVideo: action.payload
      };
    },
    current_camera(state, action) {
      return {
        ...state,
        current_camera_id: action.payload.device_id
      };
    }
  }
};
