import React, { Component } from 'react';
import { Tabs, Button, Modal, Icon, Progress } from 'antd';

import Captcha from './Captcha';
import Password from './Password';
import styles from './index.less';
import loginIcon from '../../assets/img/loginIcon.svg';
import loginText from '../../assets/img/loginText.svg';

const { TabPane } = Tabs;
class RxdLogin extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabsKey: '0',
      percent: 0,
      visible: false,
      key: 'check',
    };
  }

  tabsChange = (key) => {
    // console.log(key)
    this.setState({ tabsKey: key });
  };

  render() {
    const logType = ['密码登录', '验证码登录'];

    const { key, percent, tabsKey } = this.state;
    return (
      <div className={styles.loginContainer}>
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
                  {tabsKey === '0' ? <Password /> : <Captcha />}
                </TabPane>
              ))}
            </Tabs>
          </div>
        </div>
      </div>
    );
  }
}

export default RxdLogin;
