import React, { PureComponent, Fragment } from 'react';
import { Modal, Icon, message, Button, Spin } from 'antd';
import { connect } from 'dva';
import { withRouter } from 'react-router';
import uuid from 'uuid';
import ToolBox from '@netless/react-tool-box';
import Iconfont from '@/components/Iconfont';
import {
  WhiteWebSdk,
  RoomWhiteboard,
  Room,
  RoomState,
  RoomPhase,
  PptConverter,
  MemberState,
  ViewMode,
  DeviceType
} from 'white-react-sdk';
import 'white-web-sdk/style/index.css';
// import { UserCursor } from '../../components/whiteboard/UserCursor';
import styles from './index.less';
const zego = window.zego;
let room = null;
let uuid_temp = uuid.v4();
// @withRouter;
class WhiteBoard extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      visible: false,
      room: null,
      room_id: '',
      roomState: '',
      memberState: '',
      room_uuid: '',
      room_token: ''
    };
    // this.cursor = new UserCursor();
  }
  async startJoinRoom() {
    this.props.dispatch({
      type: 'common/changePlayDemoId',
      payload: ''
    });
    this.props.dispatch({
      type: 'common/sameId',
      payload: true
    });
    const that = this;
    const { liveDetail } = this.props;
    const whiteWebSdk = new WhiteWebSdk({
      deviceType: DeviceType.Desktop,
      preloadDynamicPPT: true,
      userCursor: true
    });
    if (liveDetail) {
      this.setState({ room_id: liveDetail.room_id }, () => {
        const { room_id } = this.state;
        // 请求创建白板房间所需id&token
        this.props.dispatch({
          type: 'common/getWhiteBoardToken',
          payload: {
            room_id: room_id,
            is_courseware: 0,
            using_courseware_id: ''
          },
          callback: async function(res) {
            if (res && res.code === 20000) {
              that.setState({
                room_uuid: res.data.room_uuid,
                room_token: res.data.room_token
              });

              try {
                // console.log('res========', res);
                room = await whiteWebSdk.joinRoom(
                  {
                    uuid: res.data.room_uuid,
                    roomToken: res.data.room_token
                    // cursorAdapter: this.cursor,
                    // userPayload: ''
                  },
                  {
                    onDisconnectWithError: error => {
                      console.error(error);
                      // return;
                    },
                    onKickedWithReason: reason => {
                      console.error('kicked with reason: ' + reason);
                    },
                    onRoomStateChanged: modifyState => {
                      that.setState({
                        roomState: { ...that.state.roomState, ...modifyState }
                      });
                      // if (modifyState.roomMembers && this.cursor) {
                      //   this.cursor.setColorAndAppliance(
                      //     modifyState.roomMembers
                      //   );
                      // }
                    }
                  }
                );
              } catch (err) {
                console.log('err=======', err);
                that.setState({ loading: false });
                return;
              }

              if (room) {
                // console.log('room====', room);
                // console.log(room.didCallSetup);
                // 清除当前屏幕内容
                room.cleanCurrentScene(false);
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
                    room_type: 'white_board'
                  },
                  uuid: uuid_temp
                };
                // console.log(JSON.stringify(send_info));
                // 发送次媒体信息
                zego.sendMediaSideInfo(JSON.stringify(send_info));
                console.log('send_info_开启白板媒体次要消息:', send_info);
                that.setState({ room: room, roomState: room.state });

                setTimeout(() => {
                  // 发送大房间消息给用户 进行签到、投票、习题提示
                  let big_send_info = send_info;
                  big_send_info.data.room_token = '';
                  let sendMsg = {
                    msg_type: 1, //消息类型 文字
                    msg_category: 2, //消息类别 系统
                    msg_content: JSON.stringify(big_send_info)
                  };
                  console.log('sendMsg_开启白板大房间消息:', sendMsg);
                  zego.sendBigRoomMessage(sendMsg);
                  zego.EventHandler('onSendBigRoomMessage', rs => {
                    console.log(
                      '发送大房间消息结果返回11111，onSendBigRoomMessage, rs = ',
                      rs
                    );
                  });
                }, 2000);
              }
            }
          }
        });
      });
    }
  }
  onWindowResize = () => {
    if (this.state.room) {
      this.state.room.refreshViewSize();
    }
  };
  componentWillMount() {}
  async componentDidMount() {
    document.body.style.overflow = 'hidden';
    window.addEventListener('resize', this.onWindowResize);
    await this.startJoinRoom();
    const { room } = this.state;
    if (room) {
      this.setState({
        loading: false
      });
    }
  }
  componentWillUnmount() {
    room && room.removeScenes('/');
    window.removeEventListener('resize', this.onWindowResize);
  }

  // 切换白板工具
  changeMemberState = current => {
    room.setMemberState(current);
  };
  // 打开弹窗
  showModal = () => {
    this.setState({
      visible: true
    });
  };
  // 关闭白板
  handleOk = e => {
    this.props.dispatch({
      type: 'common/pauseWhiteBoard',
      payload: localStorage.getItem('room-id'),
      callback: res => {
        if (res && res.code === 20000) {
          room && room.removeScenes('/');
          const { room_uuid, room_token } = this.state;
          // console.log('room_uuid:', room_uuid);
          // console.log('room_token:', room_token);
          // console.log(e);
          this.setState({
            visible: false
          });
          uuid_temp = uuid.v4();
          //主播关闭房间需要主动通知用户
          let send_info = {
            type: 'send_logout_whiteboard_room',
            data: {
              room_uuid: room_uuid,
              room_token: room_token,
              room_type: 'white_board'
            },
            uuid: uuid_temp
          };
          // console.log(JSON.stringify(send_info));
          // 发送次媒体信息
          zego.sendMediaSideInfo(JSON.stringify(send_info));
          console.log('send_info_关闭白板媒体次要消息:', send_info);
          setTimeout(() => {
            let big_send_info = send_info;
            big_send_info.data.room_token = '';
            // 发送大房间消息给用户 进行签到、投票、习题提示
            let sendMsg = {
              msg_type: 1, //消息类型 文字
              msg_category: 2, //消息类别 系统
              msg_content: JSON.stringify(big_send_info)
            };
            console.log('sendMsg_关闭白板大房间消息:', sendMsg);
            zego.sendBigRoomMessage(sendMsg);
            zego.EventHandler('onSendBigRoomMessage', rs => {
              console.log(
                '发送大房间消息结果返回11111，onSendBigRoomMessage, rs = ',
                rs
              );
            });
          }, 2000);
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
          message.error('关闭白板失败');
        }
      }
    });
  };
  // 关闭弹窗
  handleCancel = e => {
    // console.log(e);
    this.setState({
      visible: false
    });
  };

  // 向白板插入图片
  async inserDoc() {
    let uuid = '123456';
    let imageUrl =
      'https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1568634965312&di=4ee724401a86c02aee52cc87c5fc7798&imgtype=0&src=http%3A%2F%2Fb-ssl.duitang.com%2Fuploads%2Fitem%2F201703%2F04%2F20170304095053_UZeHV.jpeg';
    // 方法1 插入图片占位信息
    // 通过 uuid 来保证，completeImageUpload 更新的是同一张图片地址
    await room.insertImage({
      uuid: uuid,
      //图片中心在白板内部坐标的
      centerX: 0,
      centerY: 0,
      //图片在白板中显示的大小
      width: '100%',
      height: '100%'
    });
    // 方法2 传入图片占位 uuid，以及图片网络地址。
    room.completeImageUpload(uuid, imageUrl);
  }
  componentWillUnmount() {
    // room.cleanCurrentScene();
    room && room.removeScenes('/');
    // room && room.disconnect();
    // this.props.dispatch({
    //   type: 'common/changePlayDemoId',
    //   payload: localStorage.getItem('current_courseware_id')
    // });
  }

  setMemberState = modifyState => {
    room.setMemberState(modifyState);
  };

  render() {
    const { visible, loading, room, roomState } = this.state;

    return (
      <div className={styles.whiteboardPanel}>
        {room ? (
          <div className={styles.container}>
            <header className={styles['whiteboard-header']}>
              <ToolBox
                // 用于教具条更新教具的状态
                memberState={roomState.memberState}
                // 点击教具条可以更新教具
                setMemberState={this.changeMemberState}
                // 在教具栏目中插入自定义的按钮，比如上次按钮
                // customerComponent={[
                //   <Iconfont
                //     type="choose"
                //     className={styles.icon}
                //     onClick={this.inserDoc}
                //   />
                // ]}
              />
            </header>
            <span className={styles['close-panel']}>
              <Icon
                type="close"
                className={styles['icon-close']}
                onClick={this.showModal}
              />
            </span>
            {/* 白板房间 */}
            <RoomWhiteboard room={room} className={styles['whiteboard-room']} />

            {/* 关闭白板房间确认弹窗 */}
            <Modal
              // title="Basic Modal"
              visible={visible}
              onOk={this.handleOk}
              onCancel={this.handleCancel}
              wrapClassName={'whiteboardModal'}
              zIndex={10000}
              width={450}
              className={styles.tipModal}
            >
              <div className={styles.modalContent}>
                <span>
                  {/* <Iconfont type="Redtip" className={styles.redTip} /> */}
                  <Icon
                    type="exclamation-circle"
                    theme="filled"
                    style={{ color: '#f5222d' }}
                    className={styles.redTip}
                  />
                  <span>确认要关闭白板吗？</span>
                </span>

                <p>关闭白板将清空白板上的内容，是否关闭？</p>
              </div>
            </Modal>
          </div>
        ) : (
          <div className={styles.joinRoomFail}>
            {loading ? (
              <Spin spinning={loading} />
            ) : (
              <>
                <p>加入白板房间失败</p>
                <Button type="primary" onClick={() => this.startJoinRoom()}>
                  点击重试
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    );
  }
}
export default connect(({ common }) => ({
  ...common
}))(WhiteBoard);
