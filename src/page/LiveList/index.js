import React from 'react';
import { Button } from 'antd';
import styles from './index.less';
import Header from '../Liveroom/components/Header';

class LiveList extends React.Component {
  render() {
    return (
      <div className={styles.container}>
        <div className={styles.header}>
          <Header />
        </div>
        <div className={styles.content}>
          <p>这里是直播列表</p>
          <Button
            type="primary"
            onClick={() => {
              window.location.hash = 'liveroom';
            }}
          >
            进入直播间
          </Button>
        </div>
      </div>
    );
  }
}

export default LiveList;
