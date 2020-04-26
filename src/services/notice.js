import request from "../utils/request.js";
import { async } from "q";

// 创建公告
export async function createNotice(data) {
  return request({
    url: `/api/liveroom/livenotice/`,
    method: "POST",
    data
  });
}

// 删除公告
export async function deleteNotice(data) {
  return request({
    url: `/api/liveroom/livenotice/${data.id}/delete/`,
    method: "DELETE"
  });
}

// 获取最新公告
export async function getNotice(pramas) {
  return request({
    url: `/api/liveroom/livenotice/${pramas.liveroom_id}/newest/`,
    method: "GET"
  });
}
