import request from '../utils/request.js';

// 获取直播间指定在线成员列表
export function getUserList(params) {
  let str = params.marker
    ? `/api/liveroom/${params.liveId}/im_user_list/` +
      `?marker=${params.marker}`
    : `/api/liveroom/${params.liveId}/im_user_list/` + '';

  return request({
    url: str,
    method: 'GET'
  });
}

// 获取直播间全部在线成员列表
export function getAllUser(params) {
  return request({
    url: `/api/liveroom/${params.liveId}/im_user_all_list/`,
    method: 'GET'
  });
}

// 聊天记录提交
export function submitUserChat(params) {
  return request({
    url: `/api/chatrecord/${params.id}/user_chat/`,
    method: 'POST',
    data: params
  });
}
