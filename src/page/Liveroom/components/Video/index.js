import React from 'react';
import { connect } from 'dva';
import unStart from '@/assets/camera.png';
import styles from './index.less';

const zego = window.zego;

class Video extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  componentDidMount() {
    // 与 server 重连成功通知
    zego.EventHandler('onReconnect', rs => {
      console.log('与 server 重连成功通知，onReconnect, rs = ', rs);

      zego.changeFlag();
      zego.reConnect();
    });
  }

  render() {
    const { videoVisible, liveDetail, offVideo } = this.props;

    return (
      <div className={styles.videoMain}>
        <canvas
          id="localVideo"
          style={{
            width: '100%',
            height: '100%'
          }}
        ></canvas>

        {(!videoVisible || offVideo) && (
          <div className={styles.none}>
            {liveDetail.room_poster ? (
              <img
                src={liveDetail.room_poster}
                style={{ width: '100%', height: '100%' }}
              />
            ) : (
              <img src={unStart} style={{ width: 42, height: 52 }} />
            )}
          </div>
        )}
      </div>
    );
  }
}

export default connect(({ live, common }) => ({
  ...live,
  ...common
}))(Video);
