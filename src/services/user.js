import request from "@/utils/request.js";

// 获取用户信息
export function getUserInfo() {
  return request({
    url: `/api/users/user_info/`,
    method: "GET"
  });
}

// 更新用户信息
export function updateUserInfo(data) {
  let obj = JSON.parse(JSON.stringify(data));
  delete obj.id;
  return request({
    url: `/api/users/${data.id}/`,
    method: "PATCH",
    data: obj
  });
}
