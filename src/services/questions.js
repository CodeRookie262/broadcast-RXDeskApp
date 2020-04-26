import request from '../utils/request.js';
import { async } from 'q';

// 开启/关闭问答
export async function changeQuestion(data) {
  return request({
    url: `/api/liveroom/${data.id}/question_answer_status/`,
    method: 'PUT',
    data
  });
}

// 获取问答列表及详情接口
export async function getQuestion(data) {
  return request({
    url: `/api/liveroom/${data.live_room_id}/question_answer/session/`,
    method: 'GET'
  });
}

// 回答观众提问接口
export async function Answer(data) {
  return request({
    url: `/api/liveroom/${data.live_room_id}/question_answer/${data.session_id}/record/`,
    method: 'POST',
    data
  });
}
