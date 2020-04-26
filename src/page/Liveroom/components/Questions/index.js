import React from 'react';
import { connect } from 'dva';
import { Avatar, Icon, Menu, Dropdown } from 'antd';
import moment from 'moment';
import Iconfont from '@/components/Iconfont';
import styles from './index.less';
import questions from '../../../../assets/question.png';

const zego = window.zego;
const { ipcRenderer } = window.electron;

class AskQuestions extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      new_id: '',
      menuValue: '全部'
    };
  }

  fetchList = (num, operation) => {
    this.props.dispatch({
      type: 'questions/getQuestion',
      payload: {
        live_room_id: this.props.liveDetail.id
      },
      callback: res => {
        if (num === '1') {
          this.setState({ list: res, menuValue: '全部' });
        } else if (num === '2' && operation) {
          this.setState({ list: res, new_id: operation });
        }
      }
    });
  };

  componentDidMount() {
    if (this.props.liveDetail.id) {
      this.fetchList('1', null);
    }

    // 回答观众提问
    ipcRenderer.on('new_answer', (event, args) => {
      // console.log('new_answer:', args, new Date());
      // 发送自定义消息
      zego.sendCustomCommand(args);

      // 发送自定义消息结果返回
      zego.EventHandler('onCustomCommand', rs => {
        // console.log('发送自定义消息结果返回，onCustomCommand, rs = ', rs);

        if (
          rs.error_code === 0 &&
          JSON.parse(args.msg_content).type === 'send_question_answer_record'
        ) {
          ipcRenderer.send('send_rs', rs);
          this.setState({ new_id: '' });

          // 重新获取问答列表数据
          this.fetchList('1', null);
        }
      });
    });

    // 收到自定义消息
    zego.EventHandler('onRecvCustomCommand', rs => {
      // console.log('收到自定义消息通知，onRecvCustomCommand, rs = ', rs);
      const {
        data: { session_id }
      } = JSON.parse(rs.content);

      // 收到追加提问消息
      if (JSON.parse(rs.content).type === 'send_question_answer_record') {
        // 发送消息给详情页
        ipcRenderer.send('Recv_rs', rs);

        // 重新获取问答列表数据
        // 判断新消息位置并渲染问图标
        this.fetchList('2', session_id);
      }
      // 收到新建提问消息
      else if (JSON.parse(rs.content).type === 'create_question') {
        // 重新获取问答列表数据
        // 判断新消息位置并渲染问图标
        this.fetchList('2', session_id);
      }
    });
  }

  componentWillUnmount() {
    ipcRenderer.removeAllListeners(['new_answer']);
  }

  // 打开问答新窗口
  createNewWindow(value, id, e) {
    localStorage.setItem('win_id', id);

    const { ipcRenderer } = window.electron;
    e.preventDefault();
    const width = 288;
    const height = 387;
    const minWidth = 288;
    const minHeight = 387;

    // 渲染进程向主进程发送消息，参数一：事件名称，参数二：信息内容，可以为任何数据类型
    ipcRenderer.send('newwin', {
      width,
      height,
      minWidth,
      minHeight,
      hash: value
    });
  }

  handleMenuClick = e => {
    // console.log('click', e);
    this.setState({ menuValue: e.item.props.children });

    this.props.dispatch({
      type: 'questions/getQuestion',
      payload: {
        live_room_id: this.props.liveDetail.id
      },
      callback: res => {
        // console.log('res===', res);
        if (e.key === '1') {
          this.setState({ list: res });
        } else if (e.key === '2') {
          // 待回复
          let arr = [];
          for (let i = 0; i < res.length; i++) {
            if (
              res[i].content.length === 0 ||
              (res[i].content.length &&
                res[i].content[res[i].content.length - 1].role === 2)
            ) {
              arr.push(res[i]);
            }
          }
          this.setState({ list: arr });
        } else if (e.key === '3') {
          // 已回复
          let arr2 = [];
          for (let i = 0; i < res.length; i++) {
            if (
              res[i].content.length &&
              res[i].content[res[i].content.length - 1].role === 1
            ) {
              arr2.push(res[i]);
            }
          }
          this.setState({ list: arr2 });
        }
      }
    });
  };

  render() {
    const { menuValue, list } = this.state;

    return (
      <div className={styles.main_page}>
        <div className={styles.select_box}>
          <Dropdown
            overlay={
              <div className={styles.menuStyle}>
                <Menu onClick={this.handleMenuClick}>
                  <Menu.Item key="1">全部</Menu.Item>
                  <Menu.Item key="2">待回复</Menu.Item>
                  <Menu.Item key="3">已回复</Menu.Item>
                </Menu>
              </div>
            }
            overlayStyle={{ width: 96 }}
            placement="bottomCenter"
          >
            <span style={{ cursor: 'pointer' }}>
              {menuValue} <Icon type="caret-down" />
            </span>
          </Dropdown>
        </div>
        <div className={styles.contaner}>
          {list !== undefined && list.length ? (
            // 有提问消息时的界面
            <div className={styles.list_box}>
              {list.map(item => (
                <div
                  key={item.session_id}
                  className={styles.list_child}
                  onClick={this.createNewWindow.bind(this, 'question', item.id)}
                >
                  <p>{item.text}</p>
                  <p>{moment(item.send_time).format('YYYY-MM-DD HH:mm')}</p>
                  <p>
                    {item.audience_avatar ? (
                      <Avatar src={item.audience_avatar} size="small" />
                    ) : (
                      <Iconfont type="Headportrait" className={styles.avatar} />
                    )}
                    <span className={styles.name}>{item.audience_name}</span>
                    {this.state.new_id == item.session_id ||
                    item.content.length === 0 ||
                    (item.content.length &&
                      item.content[item.content.length - 1].role === 2) ? (
                      <Iconfont type="q" className={styles.icon} />
                    ) : null}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.img_box}>
              <p>
                <img src={questions} />
              </p>
              <p>暂无提问</p>
            </div>
          )}
        </div>
      </div>
    );
  }
}

export default connect(({ questions, live }) => ({
  ...questions,
  ...live
}))(AskQuestions);
