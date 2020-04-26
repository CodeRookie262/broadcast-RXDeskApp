import React from 'react';
import { connect } from 'dva';
import { Button, Input, message } from 'antd';
import Iconfont from '@/components/Iconfont';
import styles from './index.less';
import noticeImg from '@/assets/notice.png';

const zego = window.zego;
const { TextArea } = Input;

class Notice extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      noneShow: true,
      inputValue: '',
      editShow: false,
      createShow: false,
      content: ''
    };
  }

  createInfo = () => {
    this.setState({ createShow: true, noneShow: false });
  };

  // 发布公告
  SideInfo = () => {
    const { inputValue } = this.state;
    // console.log(this.props);
    let liveId = this.props.live.liveDetail.id;

    if (inputValue) {
      this.props.dispatch({
        type: 'notice/createNotice',
        payload: {
          content: inputValue,
          liveroom_id: liveId
        },
        callback: res => {
          // console.log('res:', res);

          let send_info = {
            type: 'notice',
            data: {
              create_at: res.data.create_at,
              content: res.data.content
            }
          };
          // console.log(JSON.stringify(send_info));

          // 发送房间消息（消息类型为系统消息）--------
          let sendMsg = {
            msg_type: 100, //消息类型 其他
            msg_category: 2, //消息类别 系统
            msg_content: JSON.stringify(send_info)
          };

          // 发送大房间消息
          zego.sendBigRoomMessage(sendMsg);

          // 发送大房间消息结果返回
          zego.EventHandler('onSendBigRoomMessage', rs => {
            // console.log(
            //   '发布公告发送大房间消息结果返回，onSendBigRoomMessage, rs = ',
            //   rs
            // );

            if (send_info.type === 'notice') {
              if (rs.error_code === 0) {
                message.success('公告发布成功');
                this.setState({
                  inputValue: '',
                  editShow: true,
                  createShow: false,
                  noneShow: false
                  // content: res.data.content
                });
              } else {
                message.error('发布公告失败');
              }
            }
          });
          // -----------------------------
        }
      });
    } else {
      message.error('公告内容不能为空');
    }
  };

  InputChange = e => {
    this.setState({
      inputValue: e.target.value
    });
  };

  cancel = () => {
    const { currentNotice } = this.props.notice;

    this.setState({ inputValue: '' });

    if (currentNotice.content) {
      this.setState({ createShow: false, editShow: true });
    } else {
      this.setState({ createShow: false, noneShow: true });
    }
  };

  // 删除公告
  Delete = () => {
    // console.log(this.props.notice);
    const { currentNotice } = this.props.notice;

    this.props.dispatch({
      type: 'notice/deleteNotice',
      payload: {
        id: currentNotice.id
      },
      callback: () => {
        let send_info = {
          type: 'delete_notice',
          data: {}
        };
        // console.log(JSON.stringify(send_info));

        // 发送房间消息（消息类型为系统消息）--------
        let sendMsg = {
          msg_type: 100, //消息类型 其他
          msg_category: 2, //消息类别 系统
          msg_content: JSON.stringify(send_info)
        };

        // 发送大房间消息
        zego.sendBigRoomMessage(sendMsg);

        // 发送大房间消息结果返回
        zego.EventHandler('onSendBigRoomMessage', rs => {
          // console.log(
          //   '删除公告发送大房间消息结果返回，onSendBigRoomMessage, rs = ',
          //   rs
          // );

          if (send_info.type === 'delete_notice') {
            if (rs.error_code === 0) {
              message.success('删除公告成功');
              this.setState({
                // content: '',
                noneShow: true,
                editShow: false
              });
            } else {
              message.error('删除公告失败');
            }
          }
        });
        // -------------------------------
      }
    });
  };

  // 编辑公告
  Edit = () => {
    const { currentNotice } = this.props.notice;

    this.setState({
      editShow: false,
      createShow: true,
      inputValue: currentNotice.content
    });
  };

  render() {
    const { noneShow, inputValue, editShow, createShow, content } = this.state;
    const { createloading, deleteloading, currentNotice } = this.props.notice;

    return (
      <div className={styles.noticePage}>
        <div className={styles.title}>
          <Iconfont type="announcementprompted" className={styles.icon} />
          &nbsp;向所有人发布系统公告
        </div>
        <div className={styles.create}>
          {/* 无公告时的展示界面 */}
          <div
            style={{
              display:
                Object.keys(currentNotice).length || createShow
                  ? 'none'
                  : 'block',
              textAlign: 'center'
            }}
          >
            <p>
              <img src={noticeImg} />
            </p>
            <p>
              <Button
                type="primary"
                onClick={this.createInfo}
                className={styles.btn}
              >
                填写公告
              </Button>
            </p>
          </div>

          {/* 点击填写公告后展示的界面 */}
          <div
            style={{ display: createShow === true ? 'block' : 'none' }}
            className={styles.inputBox}
          >
            <div className={styles.input}>
              <TextArea
                rows={8}
                value={inputValue}
                placeholder="请填写公告..."
                maxLength={100}
                onChange={event => this.InputChange(event)}
              />
              <span className={styles.titleLen}>{inputValue.length}/100</span>
            </div>

            <div className={styles.btnBox}>
              <Button
                style={{ width: 84, marginRight: 12 }}
                onClick={this.cancel}
              >
                取消
              </Button>
              <Button
                type="primary"
                style={{ width: 84 }}
                onClick={this.SideInfo}
                loading={createloading}
                disabled={inputValue ? false : true}
              >
                发布
              </Button>
            </div>
          </div>

          {/* 发布公告成功后展示的界面 */}
          <div
            className={styles.editPage}
            style={{
              display:
                Object.keys(currentNotice).length && !createShow
                  ? 'block'
                  : 'none'
            }}
          >
            <p style={{ color: '#8494a6' }}>{currentNotice.create_at}</p>
            <div className={styles.notice}>{currentNotice.content}</div>
            <div className={styles.btnBox} style={{ bottom: 0 }}>
              <Button
                style={{ width: 84, marginRight: 12 }}
                onClick={this.Delete}
                loading={deleteloading}
              >
                删除
              </Button>
              <Button
                type="primary"
                ghost
                style={{ width: 84 }}
                onClick={this.Edit}
              >
                编辑
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }
}

export default connect(({ notice, live }) => ({
  notice,
  live
}))(Notice);
