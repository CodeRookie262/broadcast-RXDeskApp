import React, { Component } from 'react';
import { connect } from 'dva';
import { Button, Icon, Col, Drawer, Modal, message } from 'antd';
import ToolBox from '@netless/react-tool-box';
import Iconfont from '@/components/Iconfont';
import { WhiteWebSdk, RoomWhiteboard, DeviceType } from 'white-react-sdk';
import 'white-web-sdk/style/index.css';
import styles from './index.less';
import uuid from 'uuid';
import noPlayDemo from '../../../../../../assets/img/noPlayDemo.png';
const zego = window.zego;
let room = null;
let whiteboardWidth = null;
let thisHeight = null;
let thisWidth = null;
let key = null;
let uuid_temp = uuid.v4();

class ContentDoc extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
      playDemo: '',
      playDemoImageUrl: [],
      type: 1,
      visible_drawer: false,
      visible_modal: false,
      room: null,
      room_id: '',
      roomState: '',
      memberState: '',
      pageIndex: 1,
      imageUrlListIndex: 0,
      multiple_key: 1,
      touch_side: false,
      index_scene_arr: [],
      id: '',
      name_current: '',
      index_scenes_current: '',
      imageUrl_current: ''
    };
  }
  moveCameraToContain = () => {};

  onWindowResize = () => {
    const { room } = this.state;
    if (room) {
      thisHeight = document.getElementById('container').clientHeight;
      thisWidth = document.getElementById('container').clientWidth;

      console.log('thisHeight:', thisHeight);
      console.log('thisWidth:', thisWidth);
      let refresh_width = thisWidth
        ? whiteboardWidth
          ? (whiteboardWidth / 100) * thisWidth
          : thisWidth
        : 800;
      room.refreshViewSize();
      room.moveCameraToContain({
        originX: -refresh_width / 2,
        originY: -thisHeight / 2,
        width: refresh_width,
        height: thisHeight,
        animationMode: 'immediately' // 2.2.2 新增 API，continuous:连续动画（默认），immediately: 瞬间完成
      });
      // console.log('refresh ==== refresh_width====', refresh_width);
      // console.log('refresh ==== thisHeight====', thisHeight);
      // console.log(
      //   'room ==== refresh ==== refresh_width====',
      //   document.getElementById('room-div').clientWidth
      // );
      // console.log(
      //   'room ==== refresh ==== thisHeight====',
      //   document.getElementById('room-div').clientHeight
      // );
    }
  };
  componentWillMount() {
    if (
      localStorage.getItem('current_courseware_id') != null &&
      this.props.playDemoId === '' &&
      key === null &&
      !this.props.sameId
    ) {
      this.startJoinRoom();
      console.log('这里是第一次条用');
      this.setState({
        id: this.props.playDemoId
      });
    }
  }
  componentDidMount() {
    window.addEventListener('resize', this.onWindowResize);
  }
  componentDidUpdate(prevProps, prevState) {
    // // 如果数据发生变化，则更新图表
    if (
      prevProps.playDemoId !== this.props.playDemoId &&
      this.props.playDemoId !== ''
    ) {
      key = 1;
      this.startJoinRoom();
      console.log('这里是第二次条用');
    }
  }
  // 请求后台获取课件演示内容
  async onGetPlayDemo() {
    const { playDemoId } = this.props;
    let id = playDemoId
      ? playDemoId
      : localStorage.getItem('current_courseware_id');
    this.setState({
      playDemo: '',
      imageUrlListIndex: 0,
      playDemoImageUrl: [],
      pageIndex: 1
    });
    if (id) {
      this.props.dispatch({
        type: 'doc/getPlayDemo',
        payload: id,
        callback: res => {
          if (res && res.code === 20000) {
            zego.EventHandler('onPublishStateUpdate', rs => {
              if (rs.error_code == 0) {
                console.log('rs=====', rs);
              }
            });
            const playDemo_list = res.data;

            this.setState(
              {
                playDemo: playDemo_list || ''
              },
              () => {
                const { playDemo } = this.state;
                this.setState({
                  playDemoImageUrl:
                    playDemo.courseware.out_url_list &&
                    playDemo.courseware.out_url_list
                });
                if (
                  playDemo.courseware.out_url_list &&
                  playDemo.courseware.out_url_list.length > 0
                ) {
                  // 向白板插入图片
                  let imageUrl = playDemo.courseware.out_url_list[0].out_url;
                  let img = new Image();
                  img.src = imageUrl;

                  img.onload = () => {
                    if (img.width) {
                      // if (img.height > img.width) {
                      //   whiteboardWidth =
                      //     (img.width / img.height) * 100 * (450 / 800);
                      // } else if (img.height / img.width === 3 / 4) {
                      //   whiteboardWidth =
                      //     (img.height / img.width) * 100 * (450 / 800);
                      // }
                      console.log('img.height:', img.height);
                      console.log('img.width:', img.width);
                      if (img.height > img.width) {
                        whiteboardWidth =
                          (img.width / img.height) * 100 * (450 / 800);
                      } else {
                        whiteboardWidth =
                          (img.width / img.height) * 100 * (450 / 800);
                      }
                      console.log('whiteboardWidth:', whiteboardWidth);
                    }
                    this.setState({
                      name_current: 'img0',
                      index_scenes_current: 0,
                      imageUrl_current: imageUrl
                    });
                    this.inserDoc('img0', 0, imageUrl);
                  };
                }
              }
            );
          }
        }
      });
    } else {
      message.error('获取课件ID失败');
      return;
    }
  }

  async startJoinRoom() {
    if (key === 2) {
      return;
    }
    this.props.dispatch({
      type: 'common/sameId',
      payload: false
    });
    const that = this;
    const { liveDetail } = this.props;
    const whiteWebSdk = new WhiteWebSdk({
      deviceType: DeviceType.Desktop,
      preloadDynamicPPT: true
    });
    if (liveDetail) {
      this.setState({ room_id: liveDetail.room_id }, () => {
        const { room_id } = this.state;
        // 请求创建白板房间所需id&token
        this.props.dispatch({
          type: 'common/getWhiteBoardToken',
          payload: {
            room_id: room_id,
            is_courseware: 1,
            using_courseware_id: localStorage.getItem('current_courseware_id')
          },
          callback: async function(res) {
            if (res && res.code === 20000) {
              that.setState({
                room_uuid: res.data.room_uuid,
                room_token: res.data.room_token
              });
              try {
                room = await whiteWebSdk.joinRoom(
                  {
                    uuid: res.data.room_uuid,
                    roomToken: res.data.room_token
                  },
                  {
                    onDisconnectWithError: error => {
                      console.error('onDisconnectWithError=========', error);
                      // return;
                    },
                    onKickedWithReason: reason => {
                      console.error('kicked with reason: ' + reason);
                    },
                    onRoomStateChanged: modifyState => {
                      that.setState({
                        roomState: { ...that.state.roomState, ...modifyState }
                      });
                    }
                  }
                );
              } catch (err) {
                console.log(err);
                message.error('创建课件房间失败');
                return;
              }
              if (room) {
                key = 2;
                whiteboardWidth = null;
                // room.cleanCurrentScene();
                room.removeScenes('/');
                // 设置主播视角
                room.setViewMode('broadcaster');
                // 禁止用户主动改变视野
                room.disableCameraTransform = true;
                //主播加入房间需要主动通知用户
                let send_info = {
                  type: 'send_join_whiteboard_room',
                  data: {
                    room_uuid: res.data.room_uuid,
                    room_token: res.data.room_token,
                    room_type: 'content_doc'
                  },
                  uuid: uuid_temp
                };
                console.log(JSON.stringify(send_info));
                // 发送次媒体信息
                zego.sendMediaSideInfo(JSON.stringify(send_info));
                console.log('send_info_开启课件媒体次要消息:', send_info);
                that.setState({ room: room, roomState: room.state });

                setTimeout(() => {
                  let big_send_info = send_info;
                  big_send_info.data.room_token = '';
                  // sendMsg_开启课件大房间消息
                  let sendMsg = {
                    msg_type: 1, //消息类型 文字
                    msg_category: 2, //消息类别 系统
                    msg_content: JSON.stringify(big_send_info)
                  };
                  console.log('sendMsg_开启课件大房间消息:', sendMsg);
                  zego.sendBigRoomMessage(sendMsg);
                  zego.EventHandler('onSendBigRoomMessage', rs => {
                    console.log(
                      '发送大房间消息结果返回11111，onSendBigRoomMessage, rs = ',
                      rs
                    );
                  });
                }, 1000);
                // 获取演示课件内容
                await that.onGetPlayDemo();
                that.setState({
                  visible_drawer: false,
                  index_scene_arr: []
                });
              }
            }
          }
        });
      });
    }
  }

  showDrawerOrNot = () => {
    const { visible_drawer } = this.state;
    this.setState({
      visible_drawer: !visible_drawer
    });
  };
  // 点击切换图片源
  changeImageSource(i, e) {
    const {
      playDemo,
      pageIndex,
      imageUrlListIndex,
      multiple_key,
      touch_side
    } = this.state;
    let index_scenes = '';
    let imageUrl = '';
    if (i === 'left' && pageIndex >= 2) {
      i = pageIndex - 2;
      if (touch_side) {
        let num = (pageIndex - 1) / 6;
        let res1 = num >= multiple_key - 1;
        let res2 = num < multiple_key;

        if (res1 && res2 && num >= 1) {
          this.setState({
            imageUrlListIndex: Number.isInteger(num)
              ? (multiple_key - 2) * 6
              : (multiple_key - 1) * 6,
            touch_side: false,
            multiple_key: Number.isInteger(num)
              ? multiple_key - 1
              : multiple_key
          });
        } else if (num < 1) {
          this.setState({
            imageUrlListIndex: 0,
            touch_side: false,
            multiple_key: 1
          });
        }
      } else {
        if (
          // imageUrlListIndex  &&
          multiple_key > 1 &&
          (pageIndex - 1) / 6 === multiple_key - 1
        ) {
          this.setState({
            imageUrlListIndex: pageIndex - 7,
            multiple_key: multiple_key - 1
          });
        }
      }
    } else if (
      i === 'right' &&
      pageIndex < playDemo.courseware.out_url_list.length
    ) {
      i = pageIndex;
      if (touch_side) {
        let num = pageIndex / 6;
        let res1 = num > multiple_key - 1;
        let res2 = num <= multiple_key;
        if (res1 && res2) {
          this.setState({
            imageUrlListIndex: Number.isInteger(num)
              ? multiple_key * 6
              : (multiple_key - 1) * 6,
            touch_side: false,
            multiple_key: Number.isInteger(num)
              ? multiple_key + 1
              : multiple_key
          });
        }
      } else {
        if (imageUrlListIndex >= 0 && pageIndex / 6 === multiple_key) {
          this.setState({
            imageUrlListIndex: pageIndex,
            multiple_key: pageIndex / 6 + 1
          });
        }
      }
    } else if (i === 'left' || i === 'right') {
      return;
    }

    this.setState({ pageIndex: i + 1 });
    let total = 0;
    if (
      playDemo.courseware.out_url_list &&
      playDemo.courseware.out_url_list.length > 0
    ) {
      total = playDemo.courseware.out_url_list.length;
      playDemo.courseware.out_url_list.map((item, index) => {
        if (i + 1 === item.page_index) {
          imageUrl = item.out_url;
          index_scenes = index;
        }
      });
    }
    let img = new Image();
    img.src = imageUrl;

    img.onload = () => {
      if (img.width) {
        // if (img.height > img.width) {
        //   whiteboardWidth = (img.width / img.height) * 100 * (450 / 800);
        // } else if (img.height / img.width === 3 / 4) {
        //   whiteboardWidth = (img.height / img.width) * 100 * (450 / 800);
        // }
        console.log('img.height:', img.height);
        console.log('img.width:', img.width);
        if (img.height > img.width) {
          whiteboardWidth = (img.width / img.height) * 100 * (450 / 800);
        } else {
          whiteboardWidth = (img.width / img.height) * 100 * (450 / 800);
        }
        console.log('whiteboardWidth:', whiteboardWidth);
      }
      this.setState({
        name_current: `img${index_scenes}`,
        index_scenes_current: index_scenes,
        imageUrl_current: imageUrl
      });
      this.inserDoc(`img${index_scenes}`, index_scenes, imageUrl);
    };
    // 发送当前演示课件的页码
    room.dispatchMagixEvent('SendWhiteBoardPageInfo', {
      imageUrl: imageUrl,
      current_page: (i + 1).toString(),
      total: total.toString(),
      timestamp: new Date().getTime()
    });
  }
  // 切换白板工具
  changeMemberState = current => {
    room.setMemberState(current);
  };
  // 打开弹窗
  showModal = () => {
    this.setState({
      visible_modal: true
    });
  };

  // 关闭课件
  handleOk = e => {
    this.props.dispatch({
      type: 'common/pauseWhiteBoard',
      payload: localStorage.getItem('room-id'),
      callback: res => {
        if (res && res.code === 20000) {
          const { room_uuid, room_token } = this.state;
          console.log('room_uuid:', room_uuid);
          console.log('room_token:', room_token);
          console.log(e);
          this.setState({
            visible: false
          });
          uuid_temp = uuid.v4();
          room && room.removeScenes('/');
          //主播关闭房间需要主动通知用户
          let send_info = {
            type: 'send_logout_whiteboard_room',
            data: {
              room_uuid: room_uuid,
              room_token: room_token,
              room_type: 'content_doc'
            },
            uuid: uuid_temp
          };
          // 发送次媒体信息
          zego.sendMediaSideInfo(JSON.stringify(send_info));
          console.log('send_info_关闭课件媒体次要消息:', send_info);

          setTimeout(() => {
            let big_send_info = send_info;
            big_send_info.data.room_token = '';
            // sendMsg_关闭课件大房间消息
            let sendMsg = {
              msg_type: 1, //消息类型 文字
              msg_category: 2, //消息类别 系统
              msg_content: JSON.stringify(big_send_info)
            };
            console.log('sendMsg_关闭课件大房间消息:', sendMsg);
            zego.sendBigRoomMessage(sendMsg);
            zego.EventHandler('onSendBigRoomMessage', rs => {
              console.log(
                '发送大房间消息结果返回11111，onSendBigRoomMessage, rs = ',
                rs
              );
            });
          }, 1000);
          uuid_temp = uuid.v4();

          this.props.dispatch({
            type: 'common/showPanel',
            payload: null
          });
          this.props.dispatch({
            type: 'common/changePlayDemoId',
            payload: ''
          });
          this.props.dispatch({
            type: 'common/sameId',
            payload: false
          });
        } else {
          message.error('关闭课件失败');
        }
      }
    });
  };

  // 关闭弹窗
  handleCancel = e => {
    console.log(e);
    this.setState({
      visible_modal: false
    });
  };
  // 向白板房间插入新场景和ppt
  async inserDoc(name, index, imageUrl) {
    const { index_scene_arr } = this.state;

    thisHeight = document.getElementById('container').clientHeight;
    thisWidth = document.getElementById('container').clientWidth;
    // thisWidth = document.getElementById('room-div').clientWidth;
    let pptWidth = thisWidth
      ? whiteboardWidth
        ? (whiteboardWidth / 100) * thisWidth
        : thisWidth
      : 800;
    // console.log('pptWidth====', pptWidth);
    // console.log('thisHeight====', thisHeight);
    // console.log('room_uuid====', this.state.room_uuid);
    // console.log('room_token====', this.state.room_token);
    // room.refreshViewSize();
    // 第一个是文件目录
    // 第二个是场景数组，一个场景中，包含 name （不填会自动生成随机名称）和 ppt（可选，一旦填入 ppt，则三个字段都需要存在）
    if (index_scene_arr.length > 0) {
      if (!index_scene_arr.includes(index)) {
        // 保证每个图片场景只创建一次
        room.refreshViewSize(); //更新白板宽高数据
        // 调整视野范围
        room.moveCameraToContain({
          originX: -pptWidth / 2,
          originY: -thisHeight / 2,
          width: pptWidth,
          height: thisHeight,
          animationMode: 'immediately' // 2.2.2 新增 API，continuous:连续动画（默认），immediately: 瞬间完成
        });
        room.putScenes(
          '/docImg',
          [
            {
              name: name,
              ppt: {
                src: imageUrl,
                width: pptWidth,
                height: thisHeight ? thisHeight : 450
              }
            }
          ],
          index
        );
      }
    } else {
      room.refreshViewSize();
      room.moveCameraToContain({
        originX: -pptWidth / 2,
        originY: -thisHeight / 2,
        width: pptWidth,
        height: thisHeight,
        animationMode: 'immediately' // 2.2.2 新增 API，continuous:连续动画（默认），immediately: 瞬间完成
      });
      room.putScenes(
        '/docImg',
        [
          {
            name: name,
            ppt: {
              src: imageUrl,
              width: pptWidth,
              height: thisHeight ? thisHeight : 450
            }
          }
        ],
        index
      );
    }
    // 保存图片场景的index（唯一）
    index_scene_arr.push(index);
    let arr = Array.from(new Set(index_scene_arr));
    this.setState({
      index_scene_arr: arr
    });
    // 该方法的参数为你想切换到的场景路径
    room.setScenePath(`/docImg/${name}`);
  }
  componentWillUnmount() {
    room && room.removeScenes('/');
    // room && room.disconnect();
    this.setState({ index_scene_arr: [] });
    whiteboardWidth = null;
    thisHeight = null;
    thisWidth = null;
    key = null;
    window.removeEventListener('resize', this.onWindowResize);
    window.removeEventListener('resize', this.a);
  }
  // 侧面板内容切换
  changeArr(type, e) {
    const { playDemoImageUrl, imageUrlListIndex } = this.state;
    this.setState({ touch_side: true });
    if (type === 'down') {
      if (playDemoImageUrl.length - 6 > imageUrlListIndex) {
        this.setState({
          imageUrlListIndex: imageUrlListIndex + 6
        });
      } else {
        return;
      }
    } else if (type === 'up') {
      if (imageUrlListIndex > 0) {
        this.setState({
          imageUrlListIndex: imageUrlListIndex - 6
        });
      } else {
        return;
      }
    }
  }

  render() {
    const {
      playDemo,
      playDemoImageUrl,
      room,
      roomState,
      visible_modal,
      visible_drawer,
      pageIndex,
      imageUrlListIndex
    } = this.state;
    return (
      <div className={styles.panel} id="container">
        {(playDemo !== '' && (
          <div
            className={styles.container}
            style={
              whiteboardWidth
                ? {
                    // width: `${whiteboardWidth}%`,
                    background: 'grey'
                  }
                : {}
            }
          >
            <header className={styles['whiteboard-header']}>
              <ToolBox
                // 用于教具条更新教具的状态
                memberState={roomState.memberState}
                // 点击教具条可以更新教具
                setMemberState={this.changeMemberState}
                style={{ opacity: '0.54' }}
              />
            </header>
            <span
              className={
                visible_drawer
                  ? styles['close-panel-disable']
                  : styles['close-panel']
              }
            >
              <Icon
                type="close"
                className={styles['icon-close']}
                onClick={!visible_drawer ? this.showModal : undefined}
              />
            </span>
            {/* 白板房间 */}
            <div id="room-div">
              <RoomWhiteboard
                room={room}
                id="room"
                className={styles['whiteboard-room']}
                style={
                  whiteboardWidth
                    ? {
                        width: `${whiteboardWidth}%`,
                        left: `${(100 - whiteboardWidth) / 2}%`
                      }
                    : {}
                }
              />
            </div>

            {playDemo.courseware.out_url_list &&
              playDemo.courseware.out_url_list.length > 0 && (
                <div
                  className={
                    visible_drawer
                      ? `${styles.btn} ${styles.btn_click}`
                      : styles.btn
                  }
                  style={{ right: visible_drawer ? '30vh' : '2vh' }}
                >
                  <Icon
                    type="left"
                    onClick={this.changeImageSource.bind(this, 'left')}
                  />
                  <span
                    onClick={this.showDrawerOrNot}
                    // style={{ display: 'inline-block' }}
                  >
                    <Iconfont type="More" className={styles['left-more']} />
                    {`${pageIndex}/${playDemo.courseware.out_url_list.length}`}
                  </span>

                  <Icon
                    type="right"
                    onClick={this.changeImageSource.bind(this, 'right')}
                  />
                </div>
              )}
            {visible_drawer ? (
              <Drawer
                className={styles.drawer}
                style={visible_drawer ? {} : { zIndex: '0' }}
                title={
                  <Icon type="up" onClick={this.changeArr.bind(this, 'up')} />
                }
                placement="right"
                closable={false}
                visible={visible_drawer}
                getContainer={false}
                mask={false}
              >
                {JSON.stringify(playDemoImageUrl) !== '[]' &&
                  playDemoImageUrl.map((item, index) => {
                    if (index >= imageUrlListIndex) {
                      return (
                        <div
                          key={index}
                          className={styles.right}
                          onClick={this.changeImageSource.bind(this, index)}
                          style={
                            pageIndex - 1 === index
                              ? { background: 'gray' }
                              : {}
                          }
                        >
                          <span className={styles['right-index']}>
                            {index + 1}
                          </span>
                          <img key={index} src={item.out_thumbnail_url} />
                        </div>
                      );
                    }
                  })}
                <div className={styles.downPanel}>
                  <Icon
                    type="down"
                    onClick={this.changeArr.bind(this, 'down')}
                  />
                </div>
              </Drawer>
            ) : null}

            {/* 关闭白板房间确认弹窗 */}
            <Modal
              className={styles.tipModal}
              visible={visible_modal}
              onOk={this.handleOk}
              onCancel={this.handleCancel}
              width={450}
            >
              <div className={styles.modalContent}>
                <span>
                  {/* <Iconfont type="redTip" className={styles.redTip} /> */}
                  <Icon
                    type="exclamation-circle"
                    theme="filled"
                    style={{ color: '#f5222d' }}
                    className={styles.redTip}
                  />
                  <span>确认要关闭课件吗？</span>
                </span>

                <p>关闭白板将清空课件上的内容，是否关闭？</p>
              </div>
            </Modal>
          </div>
        )) || <img src={noPlayDemo} className={styles.noPlayDemo} />}
      </div>
    );
  }
}

export default connect(({ doc, common }) => ({
  ...doc,
  ...common
}))(ContentDoc);
