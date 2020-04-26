import React from 'react';
import { connect } from 'dva';
import { Button, Progress } from 'antd';
import styles from './index.less';

const zego = window.zego;

class DeviceProbing extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      probingList: [{ type: 1, name: 'camera', text: '摄像头检测中...' }]
    };
  }
  componentDidMount() {
    let roomid = localStorage.getItem('room-id');

    const that = this;
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
            // 初始化sdk
            // 登录sdk直播房间
            //console.log('response', response);
            zego.init(data, response);
          }
        });

        setTimeout(() => {
          that.probingChange();
        }, 1000);
      }
    });
  }

  componentWillUnmount() {
    // 清除定时器
    // if (this.timer1) {
    clearTimeout(this.timer1);
    clearTimeout(this.timer2);
    clearTimeout(this.timer3);
    clearTimeout(this.timer4);
    // }
  }
  // 动态插入设备检测结果
  probingChange() {
    const { probingList } = this.state;
    let newArr = [...probingList];
    this.timer1 = setTimeout(() => {
      // zego.getAudioDeviceList(1);
      let res_video = zego.getVideoList();
      if (res_video) {
        newArr.length > 0 &&
          newArr.map((item, index) => {
            if (item.name === 'camera') {
              item.type = res_video.length > 0 ? 2 : 3;
              item.text = res_video.length > 0 ? '摄像头正常' : '摄像头异常';
            }
          });

        newArr.unshift({
          type: 1,
          name: 'mircophone',
          text: '麦克风检测中...'
        });
        this.setState(
          {
            probingList: newArr
          },
          () => {
            this.timer2 = setTimeout(() => {
              let res_input = zego.getAudioDeviceList(0);
              if (res_input) {
                newArr.length > 0 &&
                  newArr.map((item, index) => {
                    if (item.name === 'mircophone') {
                      item.type = res_input.length > 0 ? 2 : 3;
                      item.text =
                        res_input.length > 0 ? '麦克风正常' : '麦克风异常';
                    }
                  });
                newArr.unshift({
                  type: 1,
                  name: 'sound',
                  text: '扬声器检测中...'
                });
                this.setState(
                  {
                    probingList: newArr
                  },
                  () => {
                    let res_output = zego.getAudioDeviceList(1);
                    if (res_output) {
                      newArr.length > 0 &&
                        newArr.map((item, index) => {
                          if (item.name === 'sound') {
                            item.type = res_output.length > 0 ? 2 : 3;
                            item.text =
                              res_output.length > 0
                                ? '扬声器正常'
                                : '扬声器异常';
                          }
                          this.timer3 = setTimeout(() => {
                            this.setState(
                              {
                                probingList: newArr
                              },
                              () => {
                                const { probingList } = this.state;
                                this.timer4 = setTimeout(() => {
                                  !JSON.stringify(probingList).includes(3)
                                    ? (window.location.hash = 'livelist')
                                    : '';
                                }, 1500);
                              }
                            );
                          }, 1700);
                        });
                    }
                  }
                );
              }
            }, 1800);
          }
        );
      }
    }, 1200);
  }
  componentDidUpdate(prevState) {
    // 如果数据发生变化，则更新图表
    return prevState.probingList !== this.state.probingList;
  }
  render() {
    const { probingList } = this.state;
    return (
      <div className={styles.panel}>
        <div className={styles['btn-panel']}>
          <Button
            type="goast"
            onClick={() => (window.location.hash = 'livelist')}
          >
            跳过检测
          </Button>
        </div>
        <div className={styles['img-panel']} />
        <div className={styles['probing-panel']}>
          <Progress
            percent={(100 / 3) * probingList.length}
            showInfo={false}
            strokeColor={
              (JSON.stringify(probingList).includes(3) && 'red') || ''
            }
            style={{ marginBottom: '10px' }}
          />
          {probingList.length > 0
            ? probingList.map((item, index) => (
                <li
                  key={index}
                  style={
                    item.type === 1
                      ? { color: 'orange' }
                      : item.type === 2
                      ? { color: 'green' }
                      : item.type === 3
                      ? { color: 'red' }
                      : { color: 'black' }
                  }
                >
                  <span style={{ color: '#495b70' }}>{item.text}</span>
                </li>
              ))
            : ''}
          {(JSON.stringify(probingList).includes(3) && (
            <Button
              type="primary"
              onClick={() => {
                this.setState(
                  {
                    probingList: [
                      { type: 1, name: 'camera', text: '摄像头检测中...' }
                    ]
                  },
                  () => {
                    this.probingChange();
                  }
                );
              }}
            >
              重新检测
            </Button>
          )) ||
            ''}
        </div>
      </div>
    );
  }
}

export default connect(({ user, live, common, notice }) => ({
  user,
  ...live,
  ...common,
  ...notice
}))(DeviceProbing);
