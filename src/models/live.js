import { getLiveroom } from '../services/live.js';
import { message } from 'antd';

export default {
  namespace: 'live',
  state: {
    liveDetail: {},
    loadingLive: true,
    videoVisible: false,
    status_live: 0 // 当前直播间状态，0未开播 1直播中 2已结束 3已暂停 99已封禁
  },
  effects: {
    *getLiveroom({ payload, callback }, { call, put }) {
      yield put({
        type: 'liveLoading',
        payload: true
      });
      const response = yield call(getLiveroom, payload);
      const { code } = response;
      if (code === 20000) {
        yield put({
          type: 'saveCurrentLive',
          payload: response.data
        });
        let { status } = response.data;
        if (status === 0 || status === 1) {
          // 首次进入直播间，直播状态为 0 | 1， 均设置当前状态为0
          status = 0;
        }
        yield put({ type: 'saveStatus', status_live: status });
        localStorage.setItem('live_data', JSON.stringify(response.data));
        localStorage.setItem('live-id', response.data.id);
        localStorage.setItem('stream_sid', response.data.stream_sid);
        callback(response);
      } else {
        message.error(response.msg);
      }
      yield put({
        type: 'liveLoading',
        payload: false
      });
    }
  },
  reducers: {
    saveCurrentLive(state, action) {
      return { ...state, liveDetail: action.payload };
    },
    saveStatus(state, payload) {
      localStorage.setItem('live-status', payload.status_live);
      return { ...state, status_live: payload.status_live };
    },
    liveLoading(state, action) {
      return {
        ...state,
        loadingLive: action.payload
      };
    }
  }
};
