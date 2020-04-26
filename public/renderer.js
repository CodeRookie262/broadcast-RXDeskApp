global.electron = require('electron');
// This file is required by the index.html file and wills
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
// 引入zego sdk
var ZegoLiveRoom = require('zegoliveroom/ZegoLiveRoom.js');
var ZEGOCONSTANTS = require('zegoliveroom/ZegoConstant.js');
var WebGLRender = require('zegoliveroom/WebglRender.js');
const local_main_channel_render_ = new WebGLRender();

// app id
const app_id = '803858156'; //向zego获取app id，ID为字符串
// app key
const sign_key = [
  0x40,
  0x70,
  0x20,
  0xd1,
  0x81,
  0x7b,
  0xcd,
  0xd4,
  0x73,
  0xee,
  0x94,
  0xac,
  0x61,
  0x5f,
  0xe4,
  0x85,
  0x90,
  0x95,
  0x19,
  0x1e,
  0xfc,
  0x0e,
  0xfe,
  0x33,
  0x00,
  0x64,
  0x44,
  0xbe,
  0x7e,
  0xe9,
  0xdd,
  0x86
]; //向zego获取测试sign key，是一个数组，格式例如 [0x01, 0x03, 0x44, ....]

// 创建zego client
var zegoClient = new ZegoLiveRoom();
var current_channel_index = ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN;

// gen randow word
function randomWord(len) {
  let str = '',
    arr = [
      '0',
      '1',
      '2',
      '3',
      '4',
      '5',
      '6',
      '7',
      '8',
      '9',
      'a',
      'b',
      'c',
      'd',
      'e',
      'f',
      'g',
      'h',
      'i',
      'j',
      'k',
      'l',
      'm',
      'n',
      'o',
      'p',
      'q',
      'r',
      's',
      't',
      'u',
      'v',
      'w',
      'x',
      'y',
      'z',
      'A',
      'B',
      'C',
      'D',
      'E',
      'F',
      'G',
      'H',
      'I',
      'J',
      'K',
      'L',
      'M',
      'N',
      'O',
      'P',
      'Q',
      'R',
      'S',
      'T',
      'U',
      'V',
      'W',
      'X',
      'Y',
      'Z'
    ];
  for (let i = 0; i < len; i++) {
    let pos = Math.round(Math.random() * (arr.length - 1));
    str += arr[pos];
  }
  return str;
}

// 推流视频的流id
const TEST_PUB_STREAM_ID = 'live_stram_id' + randomWord(5);

// 推流演示课件的流id
const TEST_PUB_COURSEWARE_STREAM_ID = 'courseware_stram_id' + randomWord(5);
// 拉流的流id
const TEST_PLAY_STREAM_ID = TEST_PUB_STREAM_ID;

var camera_cap_src = null;

// 创建摄像头源
function createCameraCaptureSrc() {
  let cap_src = zegoClient.createCustomCaptureSource({
    capture_type: ZEGOCONSTANTS.ZegoCustomCaptureType.CAMERA_TYPE
  });
  if (cap_src != -1) {
    console.log('创建摄像头采集源成功，cap_src = ', cap_src);
    camera_cap_src = cap_src;
  } else {
    console.log('创建摄像头采集源失败');
  }
}

//切换为摄像头源
function changeCameraCaptureSrc(device_id) {
  console.log('device_id=====', device_id);
  zegoClient.setCameraCaptureSourceParam({
    capture_src: camera_cap_src,
    device_id: device_id
  });
  let ret = zegoClient.setCustomCaptureSource({
    capture_src: camera_cap_src,
    channel_index: current_channel_index
  });
  console.log('setCustomCameraCaptureSource ret = ', ret);

  // 停止媒体播放器的播放
  zegoClient.mediaPlayerStop({
    player_index: 0
  });

  zegoClient.setVideoFPS({ fps: 15, channel_index: current_channel_index });

  let params = {};
  if (localStorage.getItem('video_width') != undefined) {
    params.width = localStorage.getItem('video_width');
    params.height = localStorage.getItem('video_height');
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  } else {
    params.width = 640;
    params.height = 360;
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  }
  // zegoClient.setVideoEncodeResolution({
  //   width: 640,
  //   height: 480,
  //   channel_index: current_channel_index
  // });
  zegoClient.setVideoBitrate({
    bitrate: 600000,
    channel_index: current_channel_index
  });
}

// 初始化sdk
function init(data, user) {
  // 配置sdk环境，测试环境、正式环境
  // use_test_env是否使用测试环境
  zegoClient.setUseEnv({ use_test_env: true });
  // zegoClient.setUseEnv({ use_test_env: false });
  zegoClient.enableCustomCapture({ channel_index: current_channel_index });

  // 初始化sdk
  let ret = zegoClient.initSDK(
    {
      app_id: app_id,
      sign_key: sign_key,
      user_id: user.id || data.room_anchor, // 用户id
      user_name: user.name || user.phone || user.email || 'default' // 用户名字
    },
    rs => {
      if (rs.error_code == 0) {
        console.log('sdk初始化成功');
        // createImgCaptureSrc(image_path);
        createCameraCaptureSrc();

        // 登录虚拟房间，以便通过推拉流获取网络质量
        login(data.room_id, data.room_title);
        // if (data.test_room_id) {
        //   login(data.test_room_id, data.room_title);
        // }
      } else {
        console.log('sdk初始化失败,错误码为：' + rs.error_code);
        zegoClient.unInitSDK();
      }
    }
  );
  if (ret) {
    console.log('正在初始化...');
  } else {
    console.log('sdk初始化失败');
    zegoClient.unInitSDK();
  }
}

// 登录
function login(roomId, roomName) {
  // 登陆房间
  let ret = zegoClient.loginRoom(
    {
      room_id: roomId,
      room_name: roomName,
      role: ZEGOCONSTANTS.ZegoRoomRole.Anchor
    },
    rs => {
      console.log('登录结果返回 ', rs);
      if (rs.error_code == 0) {
        console.log('登录成功');
      } else {
        console.log('登录失败，错误码为：' + rs.error_code);
      }
    }
  );

  return ret;
}

// 获取摄像头列表
function getVideoList() {
  const video_devices_list = zegoClient.getVideoDeviceList();
  return video_devices_list;
}

// 选择摄像头设备
function selectVideoDevice(device_id) {
  // 获取摄像头设备列表
  let video_devices_list = zegoClient.getVideoDeviceList();
  if (video_devices_list.length > 0) {
    let id = device_id ? device_id : video_devices_list[0].device_id;
    // console.log('selectVideoDevice===id====', id);
    // console.log('renderer====device_id===', device_id);
    // console.log('video_devices_list===', video_devices_list[0].dsevice_id);

    let res = zegoClient.setVideoDevice({
      device_id: id,
      channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
    });
  } else {
    return false;
  }
}

// 预览本地摄像头
function preview(canvas_id, camera_id) {
  // 切换到摄像头源
  // changeCameraCaptureSrc(localStorage.getItem('camera_id'));
  changeCameraCaptureSrc(camera_id);

  let params = {};
  if (localStorage.getItem('video_width') != undefined) {
    params.width = localStorage.getItem('video_width');
    params.height = localStorage.getItem('video_height');
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  } else {
    params.width = 640;
    params.height = 360;
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  }

  // 是否使用摄像头
  enableCamera(true);
  // 预览本地摄像头
  let ret = false;
  if (canvas_id) {
    let set_ret = zegoClient.setPreviewView({
      canvas_view: document.getElementById(canvas_id),
      channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
    });
    if (set_ret) {
      ret = zegoClient.startPreview({
        channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
      });
    }
  } else {
    ret = zegoClient.startPreview({
      channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
    });
  }
  //开启回音消除
  zegoClient.enableAEC({ enable: true });
  // 开启噪音消除
  zegoClient.enableANS({ enable: true });
  // 开启增益
  zegoClient.enableAGC({ enable: true });
  return ret;
}

// 设置摄像头分辨率
function setVideoCaptureResolution(params) {
  const { width, height } = params;
  zegoClient.setVideoCaptureResolution({
    width,
    height,
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
  });

  localStorage.setItem('video_width', width);
  localStorage.setItem('video_height', height);
  // publishStream('更改分辨率后推流');
}

// 开始推视频流
function publishStream(title) {
  let params = {};
  if (localStorage.getItem('video_width') != undefined) {
    params.width = localStorage.getItem('video_width');
    params.height = localStorage.getItem('video_height');
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  } else {
    params.width = 640;
    params.height = 360;
    setVideoCaptureResolution(params);
    // zegoClient.setVideoEncodeResolution(params);
  }

  // 设置直播模式
  zegoClient.setLatencyMode({ mode: 2 });

  // 开始推视频流
  let ret = zegoClient.startPublishing({
    title: title,
    stream_id: TEST_PUB_STREAM_ID,
    publish_flag: ZEGOCONSTANTS.ZegoPublishFlag.ZEGO_JOIN_PUBLISH,
    params: '',
    channel_index: current_channel_index
  });
  if (ret === false) {
    // 推流失败，停止预览本地摄像头
    stopPreview();
  }
  return ret;
}
// // 虚拟房间推流---获取上行网络质量
// function publishStream_fictitious(title) {
//   // 是否使用摄像头
//   // enableCamera(false);
//   // 开始推视频流
//   let ret = zegoClient.startPublishing({
//     title: title,
//     stream_id: TEST_PUB_STREAM_ID,
//     publish_flag: ZEGOCONSTANTS.ZegoPublishFlag.ZEGO_JOIN_PUBLISH,
//     params: ''
//     // channel_index: current_channel_index
//   });
//   return ret;
// }
// 拉流---获取下行网络质量
function playStream() {
  zegoClient.startPlayingStream({
    stream_id: TEST_PLAY_STREAM_ID,
    canvas_view: '',
    params: ''
  });
}

// 停止拉流
function stopPlay() {
  zegoClient.stopPlayingStream({ stream_id: TEST_PLAY_STREAM_ID });
}

// 停止推流
function stopPublish() {
  let stop = zegoClient.stopPublishing({
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
  });
  return stop;
}
// 关闭摄像头
function enableCamera(enable) {
  return zegoClient.enableCamera({
    enable,
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
  });
}
// 停止预览本地摄像头
function stopPreview() {
  zegoClient.stopPreview({
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
  });
  return enableCamera(false);
}

// 退出房间
function logout() {
  const ret = zegoClient.logoutRoom();
  return ret;
}

// 反初始化sdk
function uninitSdk() {
  zegoClient.unInitSDK();
}

// 发送媒体次要消息
function sendMediaSideInfo(data) {
  zegoClient.activateMediaSideInfo({
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN,
    only_audio_publish: false
  });
  zegoClient.sendMediaSideInfo({
    side_info: data,
    channel_index: ZEGOCONSTANTS.PublishChannelIndex.PUBLISH_CHN_MAIN
  });
}

// im 发送聊天室消息
// function sendRoomMessage(data) {
//   zegoClient.sendRoomMessage(data);
// }

// im 发送不可靠信道消息，主要用于大并发的场景，发送一些非必须到达的消息
function sendBigRoomMessage(data) {
  zegoClient.sendBigRoomMessage(data);
}

// 发送自定义消息
function sendCustomCommand(data) {
  zegoClient.sendCustomCommand(data);
}

// 注册事件监听
function EventHandler(event, callback) {
  zegoClient.onEventHandler(event, callback);
}
// 获取音频设备列表
function getAudioDeviceList(key) {
  let audio_list = zegoClient.getAudioDeviceList({
    device_type:
      key === 1
        ? ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Output
        : ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Input
  });
  // console.log('audio_list:', audio_list);
  return audio_list;
}
// 获取默认音频设备
function getDefaultAudioDeviceId(key) {
  return zegoClient.getDefaultAudioDeviceId({
    device_type:
      key === 1
        ? ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Output
        : ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Input
  });
}
// 获取扬声器音量
function getSpeakerDeviceVolume(device_id) {
  return zegoClient.getSpeakerDeviceVolume({ device_id });
}
// 设置扬声器音量
function setSpeakerDeviceVolume(device_id, volume) {
  zegoClient.setSpeakerDeviceVolume({
    device_id,
    volume
  });
}
// 设备开启/关闭---扬声器，麦克风，摄像头
function setDeviceMute(key, device_id, is_mute, videoVisible) {
  if (key === 'sound') {
    zegoClient.setSpeakerDeviceMute({
      device_id,
      is_mute
    });
    return (ret = true);
  } else if (key === 'microphone') {
    zegoClient.setMicDeviceMute({
      device_id,
      is_mute
    });
    return (ret = true);
  } else if (key === 'camera') {
    if (videoVisible) {
      if (is_mute) {
        return enableCamera(is_mute);
        // return stopPreview();
      } else {
        return preview('', device_id);
      }
    } else {
      return enableCamera(is_mute);
    }
  }
}
// 获取麦克风音量
function getMicDeviceVolume(device_id) {
  return zegoClient.getMicDeviceVolume({ device_id });
}
// 设置麦克风音量
function setMicDeviceVolume(device_id, volume) {
  zegoClient.setMicDeviceVolume({
    device_id,
    volume
  });
}
// 麦克风声道修复 && 自动增益
function fixAECorAGC(key, value) {
  if (key === 'AEC') {
    //开启回音消除
    zegoClient.enableAEC({ enable: value === 1 ? true : false });
    // 开启噪音消除
    zegoClient.enableANS({ enable: value === 1 ? true : false });
  } else if (key === 'AGC') {
    // 开启增益
    zegoClient.enableAGC({ enable: value.target.value === 1 ? true : false });
  }
}

// 设置音量变化监听
function setAudioVolumeNotify(device_type, device_id) {
  return zegoClient.setAudioVolumeNotify({
    device_type: device_type,
    device_id: device_id
  });
}
// 更改设备---扬声器，麦克风
function setAudioDevice(key, device_id) {
  let device_type = '';
  if (key === 'sound') {
    device_type = ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Output;
    localStorage.setItem('output_id', device_id);
  } else if (key === 'microphone') {
    device_type = ZEGOCONSTANTS.AudioDeviceType.AudioDevice_Input;
    localStorage.setItem('input_id', device_id);
  }
  return zegoClient.setAudioDevice({
    device_type,
    device_id
  });
}

// -------------------------------

global.zego = {
  init,
  login,
  selectVideoDevice,
  preview,
  stopPreview,
  publishStream,
  playStream,
  EventHandler,
  stopPlay,
  stopPublish,
  logout,
  uninitSdk,
  sendMediaSideInfo,
  sendBigRoomMessage,
  sendCustomCommand,
  getVideoList,
  getAudioDeviceList,
  getSpeakerDeviceVolume,
  setSpeakerDeviceVolume,
  setDeviceMute,
  getMicDeviceVolume,
  getDefaultAudioDeviceId,
  setAudioVolumeNotify,
  setAudioDevice,
  setMicDeviceVolume,
  setVideoCaptureResolution,
  fixAECorAGC,
  enableCamera,
  CheckLineStatus,
  changeCameraCaptureSrc,
  changeFlag,
  reConnect
};

// SDK 引擎事件通知
zegoClient.onEventHandler('onAVKitEvent', rs => {
  console.log('SDK 引擎事件通知，onAVKitEvent, rs = ', rs);
  // EventType:
  // {
  //     Play_BeginRetry: 1,        /**< 开始重试拉流 */
  //     Play_RetrySuccess: 2,      /**< 重试拉流成功 */
  //     Publish_BeginRetry: 3,     /**< 开始重试推流 */
  //     Publish_RetrySuccess: 4,   /**< 重试推流成功 */
  //     Play_TempDisconnected: 5,     /**< 拉流临时中断 */
  //     Publish_TempDisconnected: 6,  /**< 推流临时中断 */
  //     Play_VideoBreak: 7,           /**< 拉流卡顿(视频) */
  // }

  if (rs.event_code == 7) {
    console.log('拉流卡顿(视频):', rs.event_code);
  }
});

// 拉流状态通知
zegoClient.onEventHandler('onPlayStateUpdate', rs => {
  console.log('拉流状态通知，onPlayStateUpdate, rs = ', rs);
  if (rs.error_code == 0) {
    console.log('拉流成功, 流id=' + rs.stream_id);
  } else {
    // 错误码
    //  = 0        拉流成功
    //  = 3        直播遇到严重错误。stateCode = 1/2 基本不会出现|请检查：1、客户端网络是否正常(从CDN拉客户端解析拉流域名失败);2、超过拉流路数(默认同时支持12路)范围限制。
    //  = 5        获取流信息失败| 基本不会出现
    //  = 6        流不存在。|请检查：1.环境是否相同(推流端和拉流端的appid和正式或测试环境是否一致);2、拉流的streamid是否已推流成功。
    //  = 7        媒体服务器连接失败。|1、推流端是否推流成功；2、环境是否相同(推流端和拉流端的appid和正式或测试环境是否一致)；3.网络是否正常。
    //  = 9        未 loginRoom 就直接调用startPlayingStream。|请检查：推流前是否已调用loginRoom。
    //  = 197612   拉的流不存在|请检查：拉流的streamid是否已推流成功。
    //  = 197619   禁止拉流|请检查：是否已调用后台禁止推流接口禁止此streamid推流。
    //  = 262145   拉流被拒绝|请检查：streamid是否已推流
    console.log('拉流失败,错误码为' + rs.error_code);
  }
});

// 拉流质量更新事件通知
zegoClient.onEventHandler('onPlayQualityUpdate', rs => {
  console.log('拉流质量更新事件通知，onPlayQualityUpdate, rs = ', rs);
  // localStorage.setItem('playQuality', rs.quality);
  localStorage.setItem('playKbps', rs.kbps.toFixed(3));
});

// 流更新事件通知
zegoClient.onEventHandler('onStreamUpdated', rs => {
  console.log('流更新事件通知， onStreamUpdated, rs = ', rs);
  // add stream
  if (rs.stream_update_type == ZEGOCONSTANTS.ZegoStreamUpdateType.StreamAdded) {
    console.log('添加视频流，流列表为:', rs.stream_list);
  } else if (
    rs.stream_update_type == ZEGOCONSTANTS.ZegoStreamUpdateType.StreamDeleted
  ) {
    // remove stream
    console.log('移除了视频流，流列表为:', rs.stream_list);
  }
});

// 推流质量通知
zegoClient.onEventHandler('onPublishQualityUpdate', rs => {
  console.log('推流质量通知，onPublishQualityUpdate, rs = ', rs);
  localStorage.setItem('publishQuality', rs.quality);
  localStorage.setItem('publishKbps', rs.kbps.toFixed(3));
});
// 房间用户更新
zegoClient.onEventHandler('onUserUpdate', rs => {
  console.log('房间用户更新，onUserUpdate, rs = ', rs);
});

// 收到自定义消息通知
zegoClient.onEventHandler('onRecvCustomCommand', rs => {
  console.log('收到自定义消息通知，onRecvCustomCommand, rs = ', rs);
});
// 流额外信息更新通知
zegoClient.onEventHandler('onStreamExtraInfoUpdated', rs => {
  console.log('流额外信息更新通知，onStreamExtraInfoUpdated, rs = ', rs);
});
// 音频设备状态更新通知
zegoClient.onEventHandler('onAudioDeviceStateChanged', rs => {
  console.log('音频设备状态更新通知，onAudioDeviceStateChanged, rs = ', rs);
});
// 视频设备状态更新通知
zegoClient.onEventHandler('onVideoDeviceStateChanged', rs => {
  console.log('视频设备状态更新通知，onVideoDeviceStateChanged, rs = ', rs);
});
// 音量变更事件通知
zegoClient.onEventHandler('onAudioVolumeChanged', rs => {
  console.log('音量变更事件通知，onAudioVolumeChanged, rs = ', rs);
});
// 设备状态错误事件通知
zegoClient.onEventHandler('onDeviceError', rs => {
  console.log('设备状态错误事件通知，onDeviceError, rs = ', rs);
});

// 临时中断通知
zegoClient.onEventHandler('onTempBroken', rs => {
  console.log('临时中断通知，onTempBroken, rs = ', rs);
  let myNotification = new Notification('异常提示', {
    body: '网络临时中断，请查看网络！'
  });
  myNotification.onclick = () => {
    console.log('通知被点击');
  };
  zego.stopPreview('localVideo');
});

// 引擎结束停止通知
zegoClient.onEventHandler('onAVEngineStop', () => {
  console.log('引擎结束停止通知，onAVEngineStop');
});
// 录制状态回调
zegoClient.onEventHandler('onRecordStatusUpdate', rs => {
  console.log('录制状态回调，onRecordStatusUpdate, rs = ', rs);
});
// 收到媒体次要信息回调
zegoClient.onEventHandler('onRecvMediaSideInfo', rs => {
  console.log('收到媒体次要信息', rs);
});

function reConnect() {
  if (localStorage.getItem('live-status') == 1) {
    // 开始推流
    let canvas_id = 'localVideo';
    let device_id = localStorage.getItem('camera_id')
      ? localStorage.getItem('camera_id')
      : null;
    let audio_input_device_list = zego.getAudioDeviceList(0);
    let audio_output_device_list = zego.getAudioDeviceList(1);
    let input_id = localStorage.getItem('input_id')
      ? localStorage.getItem('input_id')
      : audio_input_device_list.length > 0
      ? audio_input_device_list[0].device_id
      : '';
    let output_id = localStorage.getItem('input_id')
      ? localStorage.getItem('input_id')
      : audio_output_device_list.length > 0
      ? audio_output_device_list[0].device_id
      : '';
    zego.selectVideoDevice(device_id);
    zego.preview(canvas_id);
    zego.setDeviceMute('microphone', input_id, false);
    zego.setDeviceMute('sound', output_id, false);
    let res = zego.publishStream('Live');
    if (res) {
      //推流成功后开始拉流以检测网络质量
      zego.playStream();
    }
  }
}

let flag = true;

function changeFlag() {
  flag = false;
  // return flag;
}

function CheckLineStatus(status) {
  if (status === 504) {
    console.log('网络临时中断，请查看网络！！');
    let myNotification = new Notification('异常提示', {
      body: '网络临时中断，请查看网络！'
    });
    myNotification.onclick = () => {
      console.log('通知被点击');
    };
    zego.stopPreview('localVideo');
  } else if (status === 200) {
    let myNotification = new Notification('网络恢复', {
      body: '网络恢复，与server重连成功！'
    });
    myNotification.onclick = () => {
      console.log('通知被点击');
    };

    // zegoClient.onEventHandler('onReconnect', rs => {
    //   flag = false;
    //   reConnect.onReconnect();
    // });

    this.timer_r = setTimeout(() => {
      if (flag === true) {
        window.location.reload();
        clearTimeout(this.timer_r);
      } else {
        flag = true;
        clearTimeout(this.timer_r);
      }
    }, 2000);
  }
}

// 已从房间断开连接
zegoClient.onEventHandler('onDisconnect', rs => {
  console.log('已从房间断开连接,onDisconnect, rs = ', rs);
  let myNotification = new Notification('异常提示', {
    body: '主播您已从房间断开连接！'
  });
  myNotification.onclick = () => {
    console.log('通知被点击');
  };
  zego.stopPreview('localVideo');

  // 重新登录房间---------------------
  let live_data = JSON.parse(localStorage.getItem('live_data'));
  // login(live_data.room_id, live_data.room_title);
  let res = login(live_data.room_id, live_data.room_title);
  if (!res) {
    let myNotification2 = new Notification('登录房间', {
      body: '尝试重连房间失败，请检查网络是否正常'
    });

    myNotification2.onclick = () => {
      console.log('通知被点击');
    };
  }
  // -------------------------------
});

// 媒体播放器播放结束
zego.EventHandler('onMediaPlayerPlayEnd', rs => {
  console.log(
    'MediaPlayer 播放结束通知123123，onMediaPlayerPlayEnd, rs = ',
    rs
  );
});
