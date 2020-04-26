import request from '../utils/request.js';

// 获取直播间信息
export async function getLiveroom(data) {
  return request({
    url: `/api/liveroom/liveoperation/${data.roomid}/detail/`,
    method: 'GET'
  });
}
