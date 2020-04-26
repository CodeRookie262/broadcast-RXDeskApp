import React from 'react';
import { connect } from 'dva';
import { Input, Avatar, message, Tooltip } from 'antd';
import Iconfont from '@/components/Iconfont';
import styles from './index.less';

const { TextArea } = Input;
const zego = window.zego;

class IM extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      totalList: [],
      can: true
    };

    this.sendTimer = null;
  }

  componentDidMount() {
    let that = this;
    const { totalList } = this.state;

    // 收到大房间消息通知
    zego.EventHandler('onRecvBigRoomMessage', rs => {
      // debugger;
      // console.log('收到大房间消息通知，onRecvBigRoomMessage, rs = ', rs);
      //如果类型是聊天消息
      if (rs.msg_list[0].msg_category === 1) {
        let msg_list = rs.msg_list;

        for (let i = 0; i < msg_list.length; i++) {
          totalList.push(msg_list[i]);
        }
        that.setState({
          totalList
        });

        // 滚动条自动滚动到最新发送的消息
        this.GoNewMessage();
      }
    });
  }

  onChange = ({ target: { value } }) => {
    this.setState({ value });
  };

  sendMessage = () => {
    const { value, totalList, can } = this.state;
    // console.log('user:', this.props.user);
    const { user } = this.props;
    let isRender = true;

    if (can) {
      this.setState({ can: false });

      // 定时器;
      this.sendTimer = setTimeout(() => {
        this.setState({ can: true });
      }, 2000); //3秒内不能重复点击

      let hostDetail = {
        content: JSON.stringify({ avatar: user.avatar, text: value }),
        role: 1,
        user_id: user.id,
        user_name: user.name,
        phone: user.phone,
        email: user.email
      };

      // 发送聊天室消息------------------------------------
      let sendContent = {
        avatar: user.avatar,
        role: 1, //主播
        text: value,
        username: user.name || user.phone || user.email
      };

      let sendMsg = {
        msg_type: 1, //消息类型 文字
        msg_category: 1, //消息类别 聊天
        msg_content: JSON.stringify(sendContent)
      };

      if (value) {
        // 发送大房间消息
        zego.sendBigRoomMessage(sendMsg);
        this.setState({ value: '' });
      }

      // 发送大房间消息结果返回
      zego.EventHandler('onSendBigRoomMessage', rs => {
        // console.log('发送大房间消息结果返回，onSendBigRoomMessage, rs = ', rs);

        if (rs.error_code === 0 && sendMsg.msg_category === 1) {
          if (isRender) {
            totalList.push(hostDetail);
            this.setState({ totalList });

            // 滚动条自动滚动到最新发送的消息
            this.GoNewMessage();
            this.props.dispatch({
              type: 'im/submitUserChat',
              payload: {
                id: localStorage.getItem('live-id'),
                chat_content: sendContent.text,
                user_id: user.id
              }
            });

            isRender = false;
          } else {
            return false;
          }
        } else {
          message.error('发送消息失败');
        }
      });
      // ----------------------------------------------
    } else {
      return false;
    }
  };

  // 回车发送消息
  enterSend = e => {
    e.preventDefault();
    this.sendMessage();
  };

  // 回到最新消息
  GoNewMessage = () => {
    let div = document.getElementById('messegeList');
    div.scrollTop = div.scrollHeight;
  };

  componentWillUnmount() {
    this.sendTimer && clearTimeout(this.sendTimer);
  }

  render() {
    const { value, totalList } = this.state;

    let emailReg = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;
    let phoneReg = /^1[3456789]\d{9}$/;

    return (
      <div className={styles.chatBox}>
        <div className={styles.messegeList} id="messegeList">
          {totalList.length !== 0
            ? totalList.map((item, index) => (
                <div key={index}>
                  {item.role === 2 ? (
                    <div
                      className={`${styles.otherStyle} ${styles.publicStyle}`}
                    >
                      <div className={styles.avatar}>
                        {JSON.parse(item.content).avatar ? (
                          <Avatar src={JSON.parse(item.content).avatar} />
                        ) : (
                          <Iconfont type="Headportrait" />
                        )}
                      </div>
                      <div className={styles.details}>
                        <p className={styles.userMsg}>
                          {(() => {
                            if (phoneReg.test(item.user_name)) {
                              return (
                                <span>
                                  {item.user_name.replace(
                                    /(\d{3})\d{4}(\d{4})/,
                                    '$1****$2'
                                  )}
                                </span>
                              );
                            } else if (emailReg.test(item.user_name)) {
                              let str = item.user_name.split('@');
                              if (str[0].length < 3) {
                                return <span>{str[0] + '***@' + str[1]}</span>;
                              } else {
                                return (
                                  <span>
                                    {item.user_name.replace(
                                      /(.{3}).+(.{0}@.+)/g,
                                      '$1****$2'
                                    )}
                                  </span>
                                );
                              }
                            } else {
                              return <span>{item.user_name}</span>;
                            }
                          })()}
                        </p>
                        <p
                          className={styles.msgContent}
                          style={{ float: 'left' }}
                        >
                          {JSON.parse(item.content).text}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div
                      className={`${styles.mainStyle} ${styles.publicStyle}`}
                    >
                      <div className={styles.details}>
                        <p className={styles.userMsg}>
                          <span>主持人</span>
                          {(() => {
                            if (item.user_name) {
                              return <span>{item.user_name}</span>;
                            } else if (item.phone) {
                              return (
                                <span>
                                  {item.phone.replace(
                                    /(\d{3})\d{4}(\d{4})/,
                                    '$1****$2'
                                  )}
                                </span>
                              );
                            } else if (item.email) {
                              let str = item.email.split('@');
                              if (str[0].length < 3) {
                                return <span>{str[0] + '***@' + str[1]}</span>;
                              } else {
                                return (
                                  <span>
                                    {item.email.replace(
                                      /(.{3}).+(.{0}@.+)/g,
                                      '$1****$2'
                                    )}
                                  </span>
                                );
                              }
                            }
                          })()}
                        </p>
                        <p
                          className={styles.msgContent}
                          style={{ float: 'right' }}
                        >
                          {JSON.parse(item.content).text}
                        </p>
                      </div>
                      <div className={styles.avatar}>
                        {JSON.parse(item.content).avatar ? (
                          <Avatar src={JSON.parse(item.content).avatar} />
                        ) : (
                          <Iconfont type="Headportrait" />
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            : ''}
        </div>

        <div className={styles.messegeFooter}>
          <div className={styles.footerLeft}>
            <TextArea
              value={value}
              onChange={this.onChange}
              placeholder="请输入聊天内容…"
              autoSize={{ minRows: 1.6, maxRows: 1.6 }}
              onPressEnter={this.enterSend}
              maxLength={100}
            />
          </div>
          <div className={styles.footerRight}>
            <Tooltip title="发送">
              <Iconfont
                type="send"
                className={`${styles.icon} ${styles.public}`}
                onClick={this.sendMessage}
                style={{ fill: value ? '#0d6fde' : '' }}
              />
            </Tooltip>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ user, im, live }) => ({
  user,
  im,
  live
}))(IM);
