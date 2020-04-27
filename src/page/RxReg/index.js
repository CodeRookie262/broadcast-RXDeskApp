import React, { Component } from 'react';
import { Link } from 'react-router-dom';
import { Tabs } from 'antd';
import EmailReg from './Email';
import PhoneReg from './Phone';
import styles from './index.less';

const { TabPane } = Tabs;

class RxReg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      tabsKey: '1',
    };
  }

  tabsChange = (key) => {
    // console.log(key)
    this.setState({ tabsKey: key });
  };

  render() {
    const logType = ['手机注册', '邮箱注册'];
    const { tabsKey } = this.state;
    return (
      <div className={styles.regContain}>
        <div>
          <Link to="/">
            <span className={styles.goBack}>返回登录</span>
          </Link>
        </div>
        <div className={styles.fromBox}>
          <Tabs
            defaultActiveKey="0"
            animated={false}
            onChange={this.tabsChange}
            className={tabsKey === '0' ? 'style1' : 'style2'}
          >
            {logType.map((type, idx) => (
              <TabPane tab={type} key={idx}>
                {tabsKey === '0' ? <PhoneReg /> : <EmailReg />}
              </TabPane>
            ))}
          </Tabs>
        </div>
      </div>
    );
  }
}

export default RxReg;
