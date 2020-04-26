/* 
  // 上传文件到阿里云服务器，获取上传后的fid
  import uploadFile from '@/utils/upload';
  uploadFile(file)
    .then(res => {})
    .catch(res => {})
*/

import { message } from 'antd';

const config = {
  policyUrl: 'https://bss.eliteu.cn/aliyun_oss/get_upload_policy',
  imageUrl: 'https://bss.eliteu.cn/oss_media/',
  system: 'elitelive',
  user: 'xavier'
};

// 获取阿里云oss上传策略
// signature过期时间为1-2分钟，暂不缓存signature
function getSignature() {
  return new Promise((resolve, reject) => {
    let xhr = new XMLHttpRequest();
    let fd = new FormData();
    fd.append('mode', 'dev');
    fd.append('system', config.system);
    fd.append('user', config.user);
    xhr.open('POST', config.policyUrl, false);
    xhr.onreadystatechange = () => {
      if (xhr.readyState !== 4) {
        return;
      }

      if (xhr.status === 200) {
        resolve(xhr.response);
      } else {
        reject(xhr.statusText);
      }
    };
    xhr.send(fd);
  });
}
/**
 * 生成任意长度随机字符串
 * 包含数字、大写字母、小写字母
 * len: 字符串长度
 * 注意：用到了上面的随机数方法
 */

// 构建formdata上传文件，获取fid
export function uploadFile(file) {
  return getSignature().then(response => {
    return new Promise((resolve, reject) => {
      let xhr = new XMLHttpRequest();

      let fd = new FormData();
      // console.log(fd);
      const res = JSON.parse(response).data;
      let date = new Date();
      let date_j = date.setMinutes(
        date.getMinutes() - date.getTimezoneOffset()
      );
      let key = res.dir + 'elitelive/' + date_j + '/' + file.name;

      fd.append('OSSAccessKeyId', res.accessid);
      fd.append('policy', res.policy);
      fd.append('Signature', res.signature);
      fd.append('success_action_status', '200');
      // fd.append("key", res.dir);
      fd.append('key', key);
      fd.append('callback', res.callback);
      fd.append('x:originname', file.name);
      fd.append('file', file);

      xhr.open('POST', res.host);
      xhr.onreadystatechange = () => {
        if (xhr.readyState !== 4) {
          return;
        }

        if (xhr.status === 200) {
          let date = new Date();
          date.setMinutes(date.getMinutes() - date.getTimezoneOffset()); // toJSON 的时区补偿
          date
            .toJSON()
            .substr(0, 13)
            .replace(/[-T]/g, '');

          const res = JSON.parse(xhr.responseText);
          res.host = config.imageUrl;
          resolve(res);
        } else {
          reject(xhr.statusText);
        }
      };
      xhr.send(fd);
    });
  });
}

// 上传前限制文件后缀，文件大小，图片尺寸
// 获取图片base64编码，实现图片预览
export function getBase64(file, callback) {
  const reader = new FileReader();
  reader.onload = () => {
    // console.log(reader.result); // base64图片
    callback(reader.result);
  };
  reader.readAsDataURL(file);
}

// 限制图片类型
export function checkFileType(file) {
  const fileType = ['jpg', 'jpeg', 'png', 'gif', 'bmp'];
  const type = file.type.substr(file.type.lastIndexOf('/') + 1);
  if (fileType.indexOf(type) === -1) {
    message.error('请上传.jpg, .jpeg, .png, .gif, .bmp格式的文件');
    return false;
  } else {
    return true;
  }
}

// 限制图片大小
export function checkFileSize(file) {
  const isLt2M = file.size / 1024 / 1024 > 2;
  if (isLt2M) {
    message.error('Image must smaller than 2MB!');
    return false;
  } else {
    return true;
  }
}

// 限制图片尺寸
export function checkPicWidth(file) {
  let reader = new FileReader();
  reader.onload = () => {
    // 检查图片尺寸
    var image = new Image();
    image.onload = () => {
      let width = image.width;
      let height = image.height;
    };
    image.src = reader.result;
  };
  reader.readAsDataURL(file);
}
