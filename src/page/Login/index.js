import React from 'react';
import { Tabs, Button, Modal, Icon, Progress } from 'antd';
import Captcha from './Captcha';
import Password from './Password';
import styles from './index.less';
import loginIcon from '../../assets/img/loginIcon.svg';
import loginText from '../../assets/img/loginText.svg';

const { TabPane } = Tabs;

class Login extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tabsKey: '0',
      percent: 0,
      visible: false,
      key: 'check'
    };
  }

  componentDidMount() {
    const { ipcRenderer } = window.electron;
    // 自动检测更新版本
    ipcRenderer.send('update');
    ipcRenderer.on('message', (event, data) => {
      // console.log(JSON.stringify(data));
      // if (data == 'checking-for-update') {
      if (data == 'update-available') {
        this.showModal();
      } else if (data.percent) {
        this.setState({
          percent: data.percent.toFixed(3)
        });
      } else if (data == 'isUpdateNow') {
        this.setState({
          key: 'update'
        });
      }
    });

    //----------------------------------------
    ipcRenderer.on('confirm-close-app', (event, arg) => {
      const isLogin = arg.indexOf('liveroom') === -1;
      if (isLogin) {
        // localStorage.clear();
        ipcRenderer.send('close-app', 'close');
      }
    });
  }

  tabsChange = key => {
    // console.log(key)
    this.setState({ tabsKey: key });
  };

  showModal = () => {
    this.setState({
      visible: true
    });
  };

  handleOk = e => {
    let that = this;
    const { ipcRenderer } = window.electron;
    const { key } = that.state;
    if (key === 'check') {
      that.setState(
        {
          key: 'downloading'
        },
        () => {
          that.downloadUpdate();
        }
      );
    } else if (key === 'downloading') {
      console.log('downloading');
    } else if (key === 'update') {
      ipcRenderer.send('updateNow');
    }
  };

  handleCancel = e => {
    this.setState({
      visible: false
    });
  };

  // 下载最新安装包
  downloadUpdate() {
    const { ipcRenderer } = window.electron;

    ipcRenderer.send('downloadNow');
    ipcRenderer.on('isUpdateNow', function() {
      ipcRenderer.send('isUpdateNow');
    });
    // 注意："downloadProgress”事件可能存在无法触发的问题，只需要限制一下下载网速就好了
    // ipcRenderer.on('downloadProgress', (event, progressObj) => {
    //   console.log(progressObj);
    //   this.downloadPercent = Math.trunc(progressObj.percent) || 0;
    //   // this.downloadPercent = progressObj.percent.toFixed(2) || 0
    //   console.log(Math.trunc(this.downloadPercent));
    //   console.log(Math.trunc(this.downloadPercent) === 100);
    //   if (Math.trunc(this.downloadPercent) === 100) {
    //     console.log('开始更新...');
    //     ipcRenderer.on('isUpdateNow', function() {
    //       ipcRenderer.send('isUpdateNow');
    //     });
    //   }
    // });
  }

  // 组件卸载时清理定时器等
  componentWillUnmount() {
    Modal.destroyAll();
  }

  render() {
    const logType = ['验证码登录', '密码登录'];
    const { key, percent, tabsKey } = this.state;

    return (
      <div className={styles.loginPage}>
        <div className={styles.loginForm}>
          <div className={styles.mainBox}>
            <h1 className={styles.ac}>
              <img src={loginIcon} className={styles['img-icon']} />
              <img src={loginText} className={styles['img-text']} />
            </h1>

            <div className={styles.fromBox}>
              <Tabs
                defaultActiveKey="0"
                animated={false}
                onChange={this.tabsChange}
                className={tabsKey === '0' ? 'style1' : 'style2'}
              >
                {logType.map((type, idx) => (
                  <TabPane tab={type} key={idx}>
                    {tabsKey === '0' ? <Captcha /> : <Password />}
                  </TabPane>
                ))}
              </Tabs>
            </div>
          </div>
        </div>

        <Modal
          className={styles.updateModal}
          title={null}
          maskClosable={false}
          visible={this.state.visible}
          onOk={this.handleOk}
          onCancel={this.handleCancel}
          cancelText="稍后再说"
          okText={key === 'check' ? '立即下载' : '现在更新'}
          footer={
            key === 'downloading'
              ? null
              : [
                  <Button key="back" onClick={this.handleCancel}>
                    稍后再说
                  </Button>,
                  <Button key="submit" type="primary" onClick={this.handleOk}>
                    {key === 'check' ? '立即下载' : '现在更新'}
                  </Button>
                ]
          }
          closable={false}
        >
          <div>
            <div>
              <Icon
                type="exclamation-circle"
                style={{
                  color: 'orange',
                  fontSize: '21px',
                  margin: '0 5px 0 20px'
                }}
              />
              <span style={{ fontSize: '16px' }}>系统提示</span>
            </div>
            <span
              style={{
                fontSize: '14px',
                margin: '10px 0 0 47px',
                display: 'inline-block',
                width: '85%'
              }}
            >
              {' '}
              {key === 'check' ? (
                '英荔播课新版本发布啦，更多功能优化，赶快来体验吧~'
              ) : key === 'downloading' ? (
                <Progress percent={percent} style={{ width: '96%' }} />
              ) : key === 'update' ? (
                '已经下载最新版本，是否马上更新？'
              ) : (
                ''
              )}{' '}
            </span>
          </div>
        </Modal>
      </div>
    );
  }
}

export default Login;
