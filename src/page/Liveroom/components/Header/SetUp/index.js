import React, { PureComponent, Fragment } from 'react';
import {
  Modal,
  Tooltip,
  Icon,
  Tabs,
  Form,
  Select,
  Slider,
  Radio,
  Progress,
  Button
} from 'antd';
import Iconfont from '@/components/Iconfont';
import { connect } from 'dva';
import styles from './index.less';
import unStart from '@/assets/camera.png';
import { currentOs } from '@/utils/utility';

const { TabPane } = Tabs;
const { Option } = Select;
const zego = window.zego;
const { dialog } = window.electron.remote;

class SetUp extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      SetEquipmentModal: false,
      audio_input_device_list: [],
      audio_output_device_list: [],
      video_device_list: [],
      audio_output_device_volume: 0,
      audio_input_device_volume: 0,
      modalKey: '1',
      deviceList_sound: null,
      deviceList_microphone: null,
      // deviceList_camera: null,
      showCanvas: false,
      save_path: null
    };
  }

  //关闭弹窗
  handleCancel = e => {
    const { videoVisible, offVideo } = this.props;
    this.setState({
      SetEquipmentModal: false,
      showCanvas: false
    });
    if (!videoVisible || offVideo) {
      zego.stopPreview();
    } else {
      // 推流质量通知
      let ret = zego.preview('localVideo');

      if (ret == true) {
        zego.publishStream('设置摄像头后重新推流');
      }
    }
  };
  // 系统硬件设备设置弹框
  showSetUpModal(key, e) {
    this.setState(
      {
        audio_input_device_list: zego.getAudioDeviceList(0),
        audio_output_device_list: zego.getAudioDeviceList(1),
        video_device_list: zego.getVideoList(),
        modalKey: (key && key) || '1'
      },
      () => {
        const {
          audio_input_device_list,
          audio_output_device_list,
          deviceList_sound,
          deviceList_microphone
        } = this.state;
        let output_id = '';
        let input_id = '';
        if (audio_output_device_list.length > 0) {
          output_id = deviceList_sound
            ? deviceList_sound
            : audio_output_device_list[0].device_id;
        }
        if (audio_input_device_list.length > 0) {
          input_id = deviceList_microphone
            ? deviceList_microphone
            : audio_input_device_list[0].device_id;
        }
        this.setState({
          SetEquipmentModal: true,
          audio_output_device_volume: zego.getSpeakerDeviceVolume(output_id),
          audio_input_device_volume: zego.getMicDeviceVolume(input_id)
        });
        this.getCanvasId('1');
      }
    );
  }
  // form表单验证并提交
  handleSubmit = e => {
    e.preventDefault();
    this.props.form.validateFields((err, values) => {
      if (!err) {
        this.setState({ SetEquipmentModal: false });
      }
    });
  };
  // 音量大小动态提示信息
  async formatterVolume(key, value) {
    const {
      deviceList_sound,
      deviceList_microphone,
      audio_input_device_list,
      audio_output_device_list
    } = this.state;
    let device_id = '';
    if (key === 'sound') {
      // this.setState({ audio_output_device_volume: value });
      device_id = deviceList_sound
        ? deviceList_sound
        : audio_output_device_list.length > 0
        ? audio_output_device_list[0].device_id
        : '';
      await zego.setSpeakerDeviceVolume(device_id, value);
      this.setState({
        audio_output_device_volume: zego.getSpeakerDeviceVolume(device_id)
      });
    } else if (key === 'microphone') {
      device_id = deviceList_microphone
        ? deviceList_microphone
        : audio_input_device_list.length > 0
        ? audio_input_device_list[0].device_id
        : '';
      await zego.setMicDeviceVolume(device_id, value);
      this.setState({
        audio_input_device_volume: zego.getMicDeviceVolume(device_id)
      });
    }
  }
  // 自动增益&&声道修复
  fixAECorAGC(key, value) {
    zego.fixAECorAGC(key, value);
  }
  // 切换扬声器设备
  async onDeviceConditionChange(key, device_id) {
    if (key === 'sound') {
      this.setState({
        deviceList_sound: device_id
      });
      await zego.setAudioDevice(key, device_id);
      let volume = await zego.getSpeakerDeviceVolume(device_id);
      this.setState({
        audio_output_device_volume: volume
      });
    } else if (key === 'microphone') {
      this.setState({
        deviceList_microphone: device_id
      });
      await zego.setAudioDevice(key, device_id);
      let volume = await zego.getSpeakerDeviceVolume(device_id);
      this.setState({
        audio_input_device_volume: volume
      });
    }
  }
  // 切换摄像头设备
  cameraDeviceChange(device_id, e) {
    // this.setState({
    //   deviceList_camera: device_id
    // });

    if (document.getElementById('localVideo_2')) {
      let canvas_id = 'localVideo_2';
      // 切换到摄像头源
      // zego.changeCameraCaptureSrc(device_id);
      this.props.dispatch({
        type: 'common/current_camera',
        payload: {
          device_id
        }
      });
      localStorage.setItem('camera_id', device_id);

      zego.selectVideoDevice(device_id);
      zego.preview(canvas_id);
    } else {
      return;
    }
  }
  // 点击摄像头设置面板时触发
  getCanvasId(e) {
    if (e == '1') {
      setTimeout(() => {
        if (document.getElementById('localVideo_2')) {
          let device_id = localStorage.getItem('camera_id')
            ? localStorage.getItem('camera_id')
            : zego.getVideoList()[0].device_id;
          // console.log(
          //   'localStorage.getItem====',
          //   localStorage.getItem('camera_id')
          // );
          // console.log('device_id====', device_id);
          let canvas_id = 'localVideo_2';
          // 切换到摄像头源
          // zego.changeCameraCaptureSrc(device_id);
          localStorage.setItem('camera_id', device_id);
          this.props.dispatch({
            type: 'common/current_camera',
            payload: {
              device_id
            }
          });
          zego.selectVideoDevice(device_id);
          zego.preview(canvas_id);
          this.setState({ showCanvas: true });
        } else {
          return;
        }
      });
    }
  }

  componentDidMount() {
    // 录制设置
    if (currentOs() === 'mac') {
      let mac_path = localStorage.getItem('select_path')
        ? localStorage.getItem('select_path')
        : `${localStorage.getItem('osUser')}/Desktop`;
      // console.log('mac_path==', mac_path);
      localStorage.setItem('default_path', mac_path);
      this.setState({ save_path: mac_path });
    } else if (currentOs() === 'win') {
      let win_path = localStorage.getItem('select_path')
        ? localStorage.getItem('select_path')
        : `${localStorage.getItem('osUser')}\\Downloads`;
      // console.log('win_path==', win_path);
      localStorage.setItem('default_path', win_path);
      this.setState({ save_path: win_path });
    }
  }

  // 设置摄像头分辨率
  setVideoCaptureResolution(e) {
    let params = {};
    if (e === '1') {
      // 流畅
      params.width = 480;
      params.height = 270;
    } else if (e === '2') {
      // 标清
      params.width = 640;
      params.height = 360;
    } else if (e === '3') {
      // 高清
      params.width = 1280;
      params.height = 720;
    }
    zego.setVideoCaptureResolution(params);
  }

  // 录制设置自定义选择文件
  selectFinder = () => {
    // 渲染进程打开对话框并自定义选择文件保存路径
    let res = dialog.showOpenDialog({
      defaultPath: this.state.save_path,
      buttonLabel: '选择',
      properties: ['openDirectory']
    });
    // console.log('res====', res);
    if (res !== undefined) {
      // localStorage.setItem('default_path', res[0]);
      localStorage.setItem('select_path', res[0]);
      this.setState({ save_path: res[0] });
    }
  };

  render() {
    const {
      form: { getFieldDecorator },
      liveDetail
    } = this.props;
    const {
      SetEquipmentModal,
      audio_input_device_list,
      audio_output_device_list,
      video_device_list,
      modalKey,
      showCanvas,
      audio_output_device_volume,
      audio_input_device_volume,
      save_path
    } = this.state;
    let video_default_vlaue = '2';
    let video_default_width =
      localStorage.getItem('video_width') != undefined
        ? localStorage.getItem('video_width')
        : 640;
    if (video_default_width == 1280) {
      video_default_vlaue = '3';
    } else if (video_default_width == 480) {
      video_default_vlaue = '1';
    } else {
      video_default_vlaue = '2';
    }
    return (
      <div className={styles.panel}>
        <Tooltip title="设置">
          <Iconfont
            type="Setup"
            onClick={this.showSetUpModal.bind(this, '1')}
          />
        </Tooltip>
        {/* 设备设置 */}
        <Modal
          className={styles.setEquipmentModal}
          centered
          visible={SetEquipmentModal}
          footer={null}
          width={500}
          onCancel={this.handleCancel}
          zIndex={1000}
          destroyOnClose={true}
        >
          <Tabs
            defaultActiveKey={modalKey}
            // activeKey={modalKey}
            onChange={this.getCanvasId.bind(this)}
            tabPosition={'left'}
            style={{ height: 450, borderTop: 'solid 1px #eff2f6' }}
          >
            <TabPane tab="摄像头" key="1">
              <div>
                <div className={styles['modal-title']}>
                  <Icon type="camera" className={styles['icon-big']} />
                  <span>主摄像头设置</span>
                </div>
                <div className={styles.videoMain}>
                  <canvas style={{ width: '90%' }} id="localVideo_2"></canvas>

                  {!showCanvas && (
                    <div
                      className={styles.none}
                      style={
                        (!liveDetail.room_poster && {
                          background: '#f4f4f4'
                        }) ||
                        {}
                      }
                    >
                      {liveDetail.room_poster ? (
                        <img
                          src={liveDetail.room_poster}
                          style={{ width: '90%', height: '100%' }}
                        />
                      ) : (
                        <img
                          src={unStart}
                          style={{ width: 100, height: 110 }}
                        />
                      )}
                    </div>
                  )}
                </div>
                <div className={styles.deviceSelect}>
                  <Select
                    placeholder="暂无设备"
                    defaultValue={
                      localStorage.getItem('camera_id')
                        ? localStorage.getItem('camera_id')
                        : video_device_list.length > 0
                        ? video_device_list[0].device_id
                        : ''
                    }
                    onChange={id => this.cameraDeviceChange(id)}
                    style={{ width: '77%' }}
                  >
                    {video_device_list !== [] &&
                      video_device_list.map((item, index) => (
                        <Option value={item.device_id} key={index}>
                          {item.device_name}
                        </Option>
                      ))}
                  </Select>
                  <Select
                    defaultValue={video_default_vlaue}
                    onChange={this.setVideoCaptureResolution.bind(this)}
                    style={{ width: '20%' }}
                  >
                    <Option value="1">流畅</Option>
                    <Option value="2">标清</Option>
                    <Option value="3">高清</Option>
                  </Select>
                </div>
              </div>
            </TabPane>
            <TabPane tab="麦克风" key="2">
              <div>
                <div className={styles['modal-title']}>
                  <Icon type="audio" className={styles['icon-big']} />
                  <span>麦克风</span>
                </div>
                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>设备列表</span>
                  <Select
                    className={styles['content-input']}
                    defaultValue={
                      localStorage.getItem('input_id')
                        ? localStorage.getItem('input_id')
                        : audio_input_device_list.length > 0
                        ? audio_input_device_list[0].device_id
                        : ''
                    }
                    onChange={id =>
                      this.onDeviceConditionChange('microphone', id)
                    }
                  >
                    {audio_input_device_list !== [] &&
                      audio_input_device_list.map((item, index) => (
                        <Option value={item.device_id} key={index}>
                          {item.device_name}
                        </Option>
                      ))}
                  </Select>
                </div>
                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>声道修复</span>
                  <Select
                    className={styles['content-input']}
                    defaultValue={2}
                    onChange={this.fixAECorAGC.bind(this, 'AEC')}
                  >
                    <Option value={2}>不需要修复</Option>
                    <Option value={1}>修复</Option>
                  </Select>
                </div>
                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>输入音量</span>
                  <Slider
                    className={styles['content-input']}
                    value={audio_input_device_volume}
                    onChange={this.formatterVolume.bind(this, 'microphone')}
                  />
                </div>

                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>自动增益</span>
                  <Radio.Group
                    className={styles['content-input']}
                    defaultValue={1}
                    onChange={this.fixAECorAGC.bind(this, 'AGC')}
                  >
                    <Radio value={1}>开</Radio>
                    <Radio value={2}>关</Radio>
                  </Radio.Group>
                </div>

                {/* <div>
                  <p style={{ textAlign: 'left', marginLeft: '23px' }}>
                    提示：请说话，是否能听到自己的声音？
                  </p>
                  <Progress
                    className={styles.mySoundLine}
                    percent={50}
                    height={20}
                    showInfo={false}
                  />
                </div> */}
              </div>
            </TabPane>

            <TabPane tab="扬声器" key="3">
              <div>
                <div className={styles['modal-title']}>
                  <Icon type="sound" className={styles['icon-big']} />
                  <span>扬声器</span>
                </div>
                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>设备列表</span>
                  <Select
                    className={styles['content-input']}
                    defaultValue={
                      localStorage.getItem('output_id')
                        ? localStorage.getItem('output_id')
                        : audio_output_device_list.length > 0
                        ? audio_output_device_list[0].device_id
                        : ''
                    }
                    onChange={id => this.onDeviceConditionChange('sound', id)}
                  >
                    {audio_output_device_list !== [] &&
                      audio_output_device_list.map((item, index) => (
                        <Option value={item.device_id} key={index}>
                          {item.device_name}
                        </Option>
                      ))}
                  </Select>
                </div>
                <div className={styles['modal-content']}>
                  <span className={styles['content-title']}>输入音量</span>
                  <Slider
                    className={styles['content-input']}
                    value={audio_output_device_volume}
                    onChange={this.formatterVolume.bind(this, 'sound')}
                  />
                </div>
              </div>
            </TabPane>

            <TabPane tab="录制设置" key="4">
              <div>
                <div className={styles['modal-title']}>
                  <Iconfont type="video" className={styles['icon22']} />
                  <span>录制设置</span>
                </div>
                <div className={styles['modal-content']}>
                  <span
                    className={styles['content-title']}
                    style={{ width: '45%' }}
                  >
                    本地录制默认格式
                  </span>
                  <span className={styles['content-input']}>MP4</span>
                </div>
                <div className={styles['modal-content']}>
                  <span
                    className={styles['content-title']}
                    style={{ width: '45%' }}
                  >
                    本地录制保存路径
                  </span>
                  <Button
                    className={styles['content-input']}
                    onClick={this.selectFinder}
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      wordWrap: 'break-word'
                    }}
                  >
                    {save_path}
                  </Button>
                </div>
                <div
                  className={styles['modal-content']}
                  style={{ fontSize: 12, color: '#8494a6', marginTop: -23 }}
                >
                  自定义保存路径中不可包含中文，推荐使用默认下载路径
                </div>
              </div>
            </TabPane>
          </Tabs>
        </Modal>
      </div>
    );
  }
}
const SetUpForm = Form.create({ name: 'SetUp' })(SetUp);
export default connect(({ doc, live, common }) => ({
  ...doc,
  ...live,
  ...common
}))(SetUpForm);
