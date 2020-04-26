import React, { PureComponent, Fragment } from 'react';
import { Icon, Col, Slider, Dropdown, Menu, message } from 'antd';
import Iconfont from '@/components/Iconfont';
import { connect } from 'dva';
import styles from './index.less';

const zego = window.zego;

class setEquipment extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      deviceList_sound: null,
      deviceList_microphone: null,
      video_device_list: [],
      audio_output_device_volume: 0,
      audio_input_device_volume: 0,
      Closeaudio: true,
      offmicrophone: true
    };
  }
  componentDidMount() {
    this.setState(
      {
        audio_input_device_list: zego.getAudioDeviceList(0),
        audio_output_device_list: zego.getAudioDeviceList(1),
        video_device_list: zego.getVideoList()
      },
      () => {
        this.muteOrNot('camera', 2);
        this.muteOrNot('sound', 2);
        this.muteOrNot('microphone', 2);
      }
    );
  }

  // 扬声器|| 麦克风 是否设置静音,摄像头是否开启
  async muteOrNot(key, e) {
    const { videoVisible, offVideo } = this.props;
    const {
      Closeaudio,
      offmicrophone,
      audio_input_device_list,
      audio_output_device_list
    } = this.state;
    let id = '';
    let is_mute = true;
    if (key === 'sound') {
      if (audio_output_device_list.length > 0) {
        id = localStorage.getItem('output_id')
          ? localStorage.getItem('output_id')
          : audio_output_device_list.length > 0
          ? audio_output_device_list[0].device_id
          : '';
      }
      is_mute = e === 2 ? Closeaudio : !Closeaudio;
    } else if (key === 'microphone') {
      if (audio_input_device_list.length > 0) {
        id = localStorage.getItem('input_id')
          ? localStorage.getItem('input_id')
          : audio_input_device_list.length > 0
          ? audio_input_device_list[0].device_id
          : '';
      }
      is_mute = e === 2 ? offmicrophone : !offmicrophone;
    } else if (key === 'camera') {
      // id = localStorage.getItem('camera_id')
      //   ? localStorage.getItem('camera_id')
      //   : null;
      id = localStorage.getItem('camera_id')
        ? localStorage.getItem('camera_id')
        : this.props.current_camera_id;
      is_mute = e === 2 ? offVideo : !offVideo;
      this.props.dispatch({
        type: 'live/closeVideo',
        payload: {
          room_id: localStorage.getItem('room-id'),
          stream_sid: '',
          opt_type: 6
        },
        callback: () => {}
      });
    }

    // console.log('setDeviceMute:', key);
    let res = await zego.setDeviceMute(key, id, is_mute, videoVisible);
    if (res) {
      if (key === 'sound') {
        this.setState({
          Closeaudio: e === 2 ? Closeaudio : !Closeaudio
        });
      } else if (key === 'microphone') {
        this.setState({
          offmicrophone: e === 2 ? offmicrophone : !offmicrophone
        });
      } else if (key === 'camera') {
        // console.log('offVideo:', offVideo);
        this.props.dispatch({
          type: 'common/offVideo',
          payload: e === 2 ? offVideo : !offVideo
        });
        // zego.enableCamera(false);
      }
    }
  }
  // 音量大小动态提示信息
  async formatterVolume(key, value) {
    const {
      deviceList_sound,
      audio_input_device_list,
      audio_output_device_list
    } = this.state;
    let device_id = '';
    if (key === 'sound') {
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
      device_id = localStorage.getItem('input_id')
        ? localStorage.getItem('input_id')
        : audio_input_device_list.length > 0
        ? audio_input_device_list[0].device_id
        : '';

      await zego.setMicDeviceVolume(device_id, value);
      this.setState({
        audio_input_device_volume: zego.getMicDeviceVolume(device_id)
      });
    }
  }
  // 获取对应默认设备音量
  async getDeviceVolume(key, value) {
    if (value === true) {
      this.setState(
        {
          audio_input_device_list: zego.getAudioDeviceList(0),
          audio_output_device_list: zego.getAudioDeviceList(1),
          video_device_list: zego.getVideoList()
        },
        () => {
          const {
            audio_input_device_list,
            audio_output_device_list
          } = this.state;
          let output_id = '';
          let input_id = '';
          if (audio_output_device_list.length > 0) {
            output_id = localStorage.getItem('output_id')
              ? localStorage.getItem('output_id')
              : audio_output_device_list.length > 0
              ? audio_output_device_list[0].device_id
              : '';
          }
          if (audio_input_device_list.length > 0) {
            input_id = localStorage.getItem('input_id')
              ? localStorage.getItem('input_id')
              : audio_input_device_list.length > 0
              ? audio_input_device_list[0].device_id
              : '';
          }
          this.setState({
            audio_output_device_volume: zego.getSpeakerDeviceVolume(output_id),
            audio_input_device_volume: zego.getMicDeviceVolume(input_id)
          });
        }
      );
    }
  }
  // 切换摄像头设备
  cameraDeviceChange(device_id, e) {
    // console.log('device_id===', device_id);
    const { offVideo } = this.props;
    if (offVideo) {
      message.warn('请先打开摄像头', 1.5);
      return;
    } else {
      localStorage.setItem('camera_id', device_id);
      this.props.dispatch({
        type: 'common/current_camera',
        payload: {
          device_id
        }
      });
      // 切换到摄像头源
      zego.changeCameraCaptureSrc(device_id);
      zego.selectVideoDevice(device_id);
    }
  }
  componentDidUpdate(prevProps) {
    const { offVideo, dispatch } = this.props;

    if (prevProps.videoVisible !== this.props.videoVisible) {
      dispatch({
        type: 'common/offVideo',
        payload: !this.props.videoVisible
      });
      this.setState({
        offmicrophone: !this.props.videoVisible,
        Closeaudio: !this.props.videoVisible
      });
    }
  }

  render() {
    const { offVideo } = this.props;
    const {
      Closeaudio,
      offmicrophone,
      video_device_list,
      audio_output_device_volume,
      audio_input_device_volume
    } = this.state;

    const menu_sound = (
      <Menu>
        <Menu.Item>
          <Slider
            disabled={Closeaudio}
            vertical
            defaultValue={30}
            style={{ height: '130px' }}
            value={audio_output_device_volume}
            onChange={this.formatterVolume.bind(this, 'sound')}
          />
        </Menu.Item>
      </Menu>
    );
    const menu_microphone = (
      <Menu>
        <Menu.Item>
          <Slider
            disabled={offmicrophone}
            vertical
            defaultValue={30}
            style={{ height: '130px' }}
            value={audio_input_device_volume}
            onChange={this.formatterVolume.bind(this, 'microphone')}
          />
        </Menu.Item>
      </Menu>
    );
    const menu_camera = (
      <Menu className={styles.menu_camera}>
        {video_device_list !== [] &&
          video_device_list.map((item, index) => (
            <Menu.Item
              value={item.device_id}
              key={index}
              onClick={this.cameraDeviceChange.bind(this, item.device_id)}
            >
              {item.device_name}
            </Menu.Item>
          ))}
      </Menu>
    );

    return (
      <Fragment>
        <Col className={styles.col}>
          <Dropdown
            onVisibleChange={this.getDeviceVolume.bind(this, 1)}
            overlay={menu_sound}
            placement="topCenter"
            // trigger={['click']}
          >
            {/* <Tooltip title="扬声器"> */}
            <span className={styles['icon-panel']}>
              <Iconfont
                className={styles['icon-big']}
                type={Closeaudio ? 'Closeaudio' : 'audio'}
                onClick={this.muteOrNot.bind(this, 'sound')}
              />
              <Icon type="caret-down" />
            </span>
            {/* </Tooltip> */}
          </Dropdown>
          <Dropdown
            overlay={menu_microphone}
            onVisibleChange={this.getDeviceVolume.bind(this, 1)}
          >
            <span className={styles['icon-panel']}>
              <Iconfont
                className={styles['icon-big']}
                type={offmicrophone ? 'offmicrophone' : 'microphone'}
                onClick={this.muteOrNot.bind(this, 'microphone')}
              />
              <Icon type="caret-down" />
            </span>
          </Dropdown>

          <Dropdown
            overlay={menu_camera}
            onVisibleChange={this.getDeviceVolume.bind(this, 1)}
          >
            <span className={styles['icon-panel']}>
              <Iconfont
                className={styles['icon-big']}
                type={offVideo ? 'offVideo' : 'camera'}
                onClick={this.muteOrNot.bind(this, 'camera')}
              />
              <Icon type="caret-down" />
            </span>
          </Dropdown>
        </Col>
      </Fragment>
    );
  }
}
export default connect(({ doc, live, common }) => ({
  ...doc,
  ...live,
  ...common
}))(setEquipment);
