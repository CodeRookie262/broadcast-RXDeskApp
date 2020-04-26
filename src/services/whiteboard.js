import axios from 'axios';
import request from '../utils/request';

// 轮询网络状态
export async function checkOnLine(data) {
  let url = '';
  url = data === 'elite' ? `/icon` : `/baidu`;
  const host =
    process.env.NODE_ENV === 'development'
      ? ''
      : data === 'elite'
      ? `http://static.e-ducation.cn/favicon.ico`
      : `https://www.baidu.com/`;
  const instance = axios.create({
    baseURL: '',
    headers: {}
  });
  // 异常处理程序
  instance.interceptors.response.use(
    response => {
      // console.log("response.response===========", response);
      return response;
    },
    error => {
      // console.log("error.response===========", error);
      if (error.response) {
        return error.response;
      } else {
        return error;
      }
    }
  );
  let response = null;
  await instance({
    url: host ? host : url
  })
    .then(res => {
      response = res;
    })
    .catch(error => {
      response = error.response;
    });
  // console.log("response===========", response);
  return response;
}

// 获取白板token
export async function getWhiteBoardToken(data) {
  return request({
    url: `/api/liveroom/${data.room_id}/get_netless_token/?is_courseware=${data.is_courseware}&using_courseware_id=${data.using_courseware_id}`,
    method: 'GET'
    // data
  });
}

// 暂停/关闭白板
export async function pauseWhiteBoard(room_id) {
  return request({
    url: `/api/liveroom/${room_id}/get_netless_token/`,
    method: 'POST'
    // data
  });
}
