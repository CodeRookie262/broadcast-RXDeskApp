import React from 'react';
import { connect } from 'dva';
import { Avatar, Input, Tooltip, message } from 'antd';
import moment from 'moment';
import Iconfont from '@/components/Iconfont';
import styles from './index.less';

const { ipcRenderer } = window.electron;

const { TextArea } = Input;

class Chat extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      item: {},
      content: [],
      value: '',
      new_id: null,
      isClick: true
    };

    this.timer = null;
  }

  componentDidMount() {
    // console.log(this.props);
    let id = localStorage.getItem('win_id');

    this.props.dispatch({
      type: 'questions/getQuestion',
      payload: {
        live_room_id: localStorage.getItem('live-id')
      },
      callback: res => {
        // console.log('res====', res);
        for (let i = 0; i < res.length; i++) {
          if (res[i].id == id) {
            this.setState({ item: res[i], content: res[i].content });
          }
        }
      }
    });

    // 接收自定义消息
    ipcRenderer.on('new_Recv', (event, args) => {
      console.log('new_Recv:', args);

      const { content } = this.state;
      const { data } = JSON.parse(args.content);

      if (data.session_id == id) {
        content.push({
          role: data.role,
          send_time: data.send_time,
          text: data.text
        });
        this.setState({ content, new_id: data.session_id });

        this.GoNewMessage();
      }
    });
  }

  onChange = ({ target: { value } }) => {
    this.setState({ value });
  };

  // 回到最新消息
  GoNewMessage = () => {
    let div = document.getElementById('messegeList');
    div.scrollTop = div.scrollHeight;
  };

  sendMessage = () => {
    const { value, content, item, isClick } = this.state;

    if (isClick) {
      this.setState({ isClick: false });

      //定时器
      this.timer = setTimeout(() => {
        this.setState({ isClick: true });
      }, 3000); //3秒内不能重复点击

      if (value) {
        // 回答发送的对象
        let member_list = [
          {
            user_id: item.create_by,
            user_name: item.audience_name
          }
        ];

        // 回答发送的内容
        let msg_content = JSON.stringify({
          type: 'send_question_answer_record',
          data: {
            session_id: item.session_id,
            create_by: item.create_by,
            name: item.room_anchor_name,
            send_time: moment().format('YYYY-MM-DD HH:mm:ss'),
            avatar: item.room_anchor_avatar,
            role: 1,
            text: value
          }
        });

        let send = {
          member_list: member_list,
          msg_content: msg_content
        };
        // console.log('send=====', send);

        // 请求后端接口
        this.props.dispatch({
          type: 'questions/Answer',
          payload: {
            live_room_id: localStorage.getItem('live-id'),
            session_id: item.session_id,
            role: 1,
            text: value
          },
          callback: () => {
            // 向主进程发送消息
            ipcRenderer.send('host_answer', send);

            // -------------------------------------------
            let can = true;
            // 监听发送自定义消息后的结果
            ipcRenderer.on('answer_rs', (event, args) => {
              if (can) {
                console.log('answer_rs:', args);

                if (args.error_code === 0) {
                  content.push({
                    role: 1,
                    send_time: moment().format('YYYY-MM-DD HH:mm:ss'),
                    text: value
                  });
                  this.setState({ content });

                  this.setState({ value: '', new_id: null });

                  // 滚动条自动滚动到最新发送的消息
                  this.GoNewMessage();
                } else {
                  message.error('消息发送失败，错误码为：' + args.error_code);
                }

                can = false;
              } else {
                console.log('22222222222222');
              }
            });
            // -----------------------------------------------
          }
        });
      }
    } else {
      return false;
    }
  };

  // 回车发送消息
  enterSend = e => {
    e.preventDefault();
    this.sendMessage();
  };

  componentWillUnmount() {
    this.timer && clearInterval(this.timer);
    ipcRenderer.removeAllListeners(['answer_rs', 'new_Recv']);
  }

  render() {
    let { item, value, content, new_id } = this.state;
    // console.log('content:', content);

    return (
      <div className={styles.win_box}>
        <div className={styles.context} id="messegeList">
          <div className={styles.list_child}>
            <p>{item.text}</p>
            <p>{moment(item.send_time).format('YYYY-MM-DD HH:mm')}</p>
            <p>
              {item.audience_avatar ? (
                <Avatar src={item.audience_avatar} size="small" />
              ) : (
                <Iconfont type="Headportrait" className={styles.avatar} />
              )}
              <span className={styles.name} style={{ width: 192 }}>
                {item.audience_name}
              </span>
              {new_id == item.session_id ||
              item.content.length === 0 ||
              (item.content.length &&
                item.content[item.content.length - 1].role === 2) ? (
                <Iconfont type="q" className={styles.icon} />
              ) : null}
            </p>
          </div>

          {content.length
            ? content.map((items, index) => (
                <div
                  className={`${styles.list_child} ${styles.host}`}
                  style={{ background: items.role === 1 ? '#f7f9fc' : '#fff' }}
                  key={index}
                >
                  <p style={{ fontSize: 14, fontWeight: 'normal' }}>
                    {items.text}
                  </p>
                  <p>{moment(items.send_time).format('YYYY-MM-DD HH:mm')}</p>
                  {/* 主持人 */}
                  {items.role === 1 ? (
                    <p>
                      {item.room_anchor_avatar ? (
                        <Avatar src={item.room_anchor_avatar} size="small" />
                      ) : (
                        <Iconfont
                          type="Headportrait"
                          className={styles.avatar}
                        />
                      )}
                      <span className={styles.name}>
                        {item.room_anchor_name}
                      </span>
                      <i></i>
                      <span className={styles.identity}>主持人</span>
                    </p>
                  ) : (
                    // 观众
                    <p>
                      {item.audience_avatar ? (
                        <Avatar src={item.audience_avatar} size="small" />
                      ) : (
                        <Iconfont
                          type="Headportrait"
                          className={styles.avatar}
                        />
                      )}
                      <span className={styles.name}>{item.audience_name}</span>
                    </p>
                  )}
                </div>
              ))
            : null}
        </div>

        <div className={styles.messegeFooter}>
          <div className={styles.footerLeft}>
            <TextArea
              value={value}
              onChange={this.onChange}
              placeholder="请输入您的回答"
              autoSize={{ minRows: 1.6, maxRows: 1.6 }}
              onPressEnter={this.enterSend}
              maxLength={100}
            />
          </div>
          <div className={styles.footerRight}>
            <Tooltip title="发送">
              <Iconfont
                type="send"
                className={styles.icon}
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

export default connect(({ questions, user }) => ({
  ...questions,
  user
}))(Chat);
