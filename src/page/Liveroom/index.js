import React, { Component } from 'react';
import { connect } from 'dva';
import { Spin, Tabs, Tooltip } from 'antd';
import Header from './components/Header';
import Content from './components/Content';
import IM from './components/IM';
import Notice from './components/Notice';
import Footer from './components/Footer';
import Video from './components/Video';
import AskQuestions from './components/Questions';
import styles from './index.less';
import Iconfont from '@/components/Iconfont';

const zego = window.zego;

const { TabPane } = Tabs;

class Liveroom extends Component {
  constructor(props) {
    super(props);
    this.state = {
      key: '1',
      tabBarGutter: 26.5,
      TabsRender: [
        { key: '1', icon: 'chat', components: IM, name: '聊天' },
        { key: '2', icon: 'questions', components: AskQuestions, name: '问答' },
        { key: '3', icon: 'announcement', components: Notice, name: '公告' }
      ]
    };
  }

  componentDidMount() {
    let roomid = localStorage.getItem('room-id');

    // 获取直播间信息
    this.props.dispatch({
      type: 'live/getLiveroom',
      payload: {
        roomid
      },
      callback: res => {
        let data = res.data;
        // 获取用户信息
        this.props.dispatch({
          type: 'user/getUserInfo',
          callback: response => {
            //console.log('response', response);
            // 初始化sdk
            // 登录sdk直播房间
            zego.init(data, response);
          }
        });

        // 获取全部成员
        this.allUser(data.id);

        // 针对禁言获取直播间全部成员------------------------------
        //设置定时器30秒刷新一次成员列表
        this.interval = setInterval(() => {
          // 获取全部成员
          this.allUser(data.id);
        }, 30000);

        //监听是否有网络，无网络清除定时器，停止请求成员列表
        window.addEventListener('offline', e => {
          // console.log('断网');
          clearInterval(this.interval);
        });

        window.addEventListener('online', e => {
          // console.log('有网');
          // 有网后再重新恢复成员列表请求
          this.interval = setInterval(() => {
            // 获取全部成员
            this.allUser(data.id);
          }, 30000);
        });
        // -------------------------------------------------

        // 查看有无最新公告
        this.props.dispatch({
          type: 'notice/getNotice',
          payload: {
            liveroom_id: data.id
          }
        });

        // 加载白板
        if (data.is_open_whiteboard == 4) {
          this.props.dispatch({
            type: 'common/showPanel',
            payload: 1
          });
        } else if (data.is_open_whiteboard == 1) {
          this.props.dispatch({
            type: 'common/showPanel',
            payload: 2
          });
        }

        // 被挤掉线通知---------------------
        zego.EventHandler('onKickOut', rs => {
          console.log('被挤掉线通知，onKickOut, rs = ', rs);
          let myNotification = new Notification('异常提示', {
            body: '您的帐号在其他设备登录，您已下线！'
          });
          myNotification.onclick = () => {
            console.log('通知被点击');
          };
          // 退至登录页
          window.location.hash = '/';
        });
        // --------------------------------
      }
    });
  }

  // 获取全部成员
  allUser = liveId => {
    this.props.dispatch({
      type: 'im/getAllUser',
      payload: {
        liveId
      }
    });
  };

  // tab切换
  callback = key => {
    this.setState({ key });
  };

  componentWillUnmount() {
    this.interval && clearInterval(this.interval);
  }

  render() {
    const { key, TabsRender, tabBarGutter } = this.state;
    const { loadingLive, currentNotice } = this.props;

    return (
      <>
        {loadingLive ? (
          <div style={{ textAlign: 'center', margin: '100px auto' }}>
            <Spin spinning={loadingLive} size="large" />
          </div>
        ) : (
          <div className={styles.container}>
            <div className={styles.header}>
              <Header />
            </div>
            <div className={styles.content}>
              <div className={styles.left}>
                <div className={styles.doc}>
                  <Content />
                </div>
                <div className={styles.footer}>
                  <Footer />
                </div>
              </div>
              <div className={styles.right}>
                <div className={styles.video}>
                  <Video />
                </div>
                <div className={styles.sider}>
                  {Object.keys(currentNotice).length ? (
                    <div className={styles.notice}>
                      <Iconfont
                        type="announcement"
                        className={styles.noticeIcon}
                      />
                      <span style={{ fontSize: 14 }}>
                        {currentNotice.content}
                      </span>
                    </div>
                  ) : (
                    ''
                  )}

                  <Tabs
                    defaultActiveKey={key}
                    activeKey={key}
                    tabBarGutter={tabBarGutter}
                    onChange={this.callback}
                  >
                    {TabsRender.map(item => (
                      <TabPane
                        tab={
                          <Tooltip title={item.name}>
                            <Iconfont
                              type={item.icon}
                              className={styles.public}
                              style={{
                                marginLeft: tabBarGutter === 26.5 ? 20 : 0
                              }}
                            />
                          </Tooltip>
                        }
                        key={item.key}
                      >
                        <item.components />
                      </TabPane>
                    ))}
                  </Tabs>
                </div>
              </div>
            </div>
          </div>
        )}
      </>
    );
  }
}

export default connect(({ live, user, notice, im, common, questions }) => ({
  ...live,
  user,
  ...notice,
  im,
  ...common,
  ...questions
}))(Liveroom);
