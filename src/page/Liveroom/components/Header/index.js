import React, { PureComponent } from 'react';
import { Menu, Dropdown, Icon, Popover, Spin } from 'antd';
import User from './User';
import SetUp from './SetUp';
import PerfectInformation from './perfectInformation';
import Iconfont from '@/components/Iconfont';
import { connect } from 'dva';
import styles from './index.less';

const zego = window.zego;

class Header extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      userVisible: false,
      userKey: 1,
      netSpeedUp: 0,
      netSpeedDown: 0,
      netQuality: null,
      perfectInformationVisible: false,
      perfectInformationKey: 0
    };
    this.showUserModal = this.showUserModal.bind(this);
  }

  showUserModal() {
    let key = this.state.userKey;
    key++;
    this.setState({
      userVisible: true,
      userKey: key
    });
  }
  showPerfectInformation() {
    let key = this.state.perfectInformationKey;
    key = this.state.userKey + 1;
    this.setState({
      perfectInformationVisible: true,
      perfectInformationKey: key
    });
  }
  // 监听网络状态的改变：
  onConnectionChange(time) {
    this.timer1 = setTimeout(() => {
      const { offVideo } = this.props;
      const {
        rtt,
        downlink,
        effectiveType,
        saveData,
        onchange
      } = navigator.connection;
      let qualityNum = null;
      let downNet = (downlink * 1024) / 8;
      downNet > 500
        ? (qualityNum = '0')
        : downNet >= 300 && downNet <= 500
        ? (qualityNum = '1')
        : downNet < 300
        ? (qualityNum = '2')
        : null;
      // console.log(`有效网络连接类型: ${effectiveType}`);
      // console.log(`估算的往返时间: ${rtt}ms`);
      // console.log(`打开/请求数据保护模式: ${saveData}`);
      // console.log(onchange);
      // console.log(`估算的下行速度/带宽: ${downNet}Kbs/s`);
      offVideo &&
        this.setState(
          {
            netSpeedDown: downNet.toFixed(3),
            netQuality: qualityNum
            // netSpeedDown: 0
          },
          () => {
            offVideo && this.onConnectionChange(2000);
          }
        );
    }, time);
  }
  // 监听推流信息
  onPublishQuality() {
    this.timer2 = setTimeout(() => {
      const { offVideo } = this.props;
      // 推流质量通知
      zego.EventHandler('onPublishQualityUpdate', rs => {
        // console.log('推流质量通知，onPublishQualityUpdate, rs = ', rs);

        !offVideo &&
          this.setState(
            {
              netSpeedUp: rs.kbps.toFixed(3),
              netQuality: JSON.stringify(rs.quality)
            },
            () => {
              !offVideo && this.onPublishQuality();
            }
          );
      });
      // 拉流质量更新事件通知
      zego.EventHandler('onPlayQualityUpdate', rs => {
        !offVideo &&
          this.setState({
            netSpeedDown: rs.kbps.toFixed(3)
          });
      });
    }, 0);
  }
  componentDidMount() {
    this.timer3 = setInterval(() => {
      const { lineStatus } = this.props;
      this.props.dispatch({
        type: 'common/checkOnLine',
        payload: 'elite',
        callback: res => {
          if (res && res.status && res.status === 504) {
            this.props.dispatch({
              type: 'common/checkOnLine',
              payload: 'baidu',
              callback: res => {
                if (res && res.status && res.status === 504) {
                  console.log('check======res=====baidu', res);
                  zego.CheckLineStatus(res.status);
                  this.setState(
                    {
                      netSpeedDown: null,
                      netQuality: null,
                      netSpeedUp: null
                    },
                    () => {
                      this.timer1 && clearTimeout(this.timer1);
                      this.timer2 && clearTimeout(this.timer2);
                    }
                  );
                }
              }
            });
          } else if (
            res &&
            res.status &&
            res.status === 200 &&
            lineStatus === 504
          ) {
            zego.CheckLineStatus(res.status);
          }
        }
      });
    }, 2000);
    // 获取用户信息
    this.props.dispatch({
      type: 'user/getUserInfo',
      callback: response => {
        //console.log('name==============', response);
        if (response.name === '') {
          this.showPerfectInformation();
        }
      }
    });
    // 未开播前网络检测
    const { downlink } = navigator.connection;
    let qualityNum = null;
    let downNet = (downlink * 1024) / 8;
    downNet > 500
      ? (qualityNum = '0')
      : downNet >= 300 && downNet <= 500
      ? (qualityNum = '1')
      : downNet < 300
      ? (qualityNum = '2')
      : null;
    this.setState({
      netSpeedDown: downNet.toFixed(3),
      netQuality: qualityNum
    });

    // 执行定时器任务，xx秒检测一次网速
    this.onConnectionChange(2000);
    //断网
    window.addEventListener('offline', () => {
      this.setState(
        {
          netSpeedDown: null,
          netQuality: null,
          netSpeedUp: null
        },
        () => {
          this.timer1 && clearTimeout(this.timer1);
        }
      );
    });
  }
  componentDidUpdate(prevProps) {
    // console.log(prevProps);
    // console.log(this.props.user);
    const { userVisible_props } = this.props.user;

    if (prevProps.user !== this.props.user && userVisible_props) {
      this.showUserModal();
    }
    const { offVideo } = this.props;
    if (offVideo) {
      this.timer1 && clearTimeout(this.timer1);
      this.timer2 && clearTimeout(this.timer2);
      this.onConnectionChange(2000);
    } else if (!offVideo) {
      this.timer1 && clearTimeout(this.timer1);
      this.timer2 && clearTimeout(this.timer2);
      this.onPublishQuality();
    }
  }

  // 组件卸载时清理定时器等
  componentWillUnmount() {
    this.timer1 && clearTimeout(this.timer1);
    this.timer2 && clearTimeout(this.timer2);
    this.timer3 && clearInterval(this.timer3);
    this.setState({
      perfectInformationVisible: false
    });
  }
  render() {
    const { room_title } = this.props.live.liveDetail;

    const { offVideo } = this.props;

    const {
      userVisible,
      userKey,
      netSpeedUp,
      netSpeedDown,
      netQuality,
      perfectInformationVisible,
      perfectInformationKey
    } = this.state;

    let Quality = netQuality
      ? netQuality
      : localStorage.getItem('publishQuality');
    const content = (
      <div className={styles.netQuality}>
        <div>
          <p>
            <Icon
              type="arrow-up"
              style={{ color: '#2894FF', marginRight: '5px' }}
            />
            <span>
              {netSpeedUp
                ? netSpeedUp !== '0.000'
                  ? netSpeedUp + 'Kbps'
                  : '暂无数据'
                : localStorage.getItem('publishKbps') && !offVideo
                ? localStorage.getItem('publishKbps') + 'Kbps'
                : '暂无数据'}
            </span>
          </p>
          <p>
            <Icon
              type="arrow-down"
              style={{ color: '#00CED1', marginRight: '5px' }}
            />
            <span>
              {netSpeedDown
                ? netSpeedDown !== '0.000'
                  ? netSpeedDown + 'Kbps'
                  : '暂无数据'
                : localStorage.getItem('playKbps') && !offVideo
                ? localStorage.getItem('playKbps') + 'Kbps'
                : '暂无数据'}
            </span>
          </p>
        </div>
        <div className={styles['net-right']}>
          <span
            style={
              Quality === '0'
                ? { color: 'green' }
                : Quality === '1'
                ? { color: '#2894FF' }
                : Quality === '2'
                ? { color: 'red' }
                : {}
            }
          >
            网络
            {Quality === '0'
              ? '好'
              : Quality === '1'
              ? '中'
              : Quality === '2'
              ? '差'
              : ''}
          </span>
        </div>
      </div>
    );

    return (
      <div className={styles.panel}>
        <h1
          onClick={() => {
            if (window.location.hash === '#liveroom') {
              window.location.hash = 'livelist';
            }
          }}
        >
          {room_title}
        </h1>
        <div className={styles.right}>
          <Dropdown
            overlay={
              <div>
                <Menu>
                  <Menu.Item onClick={this.showUserModal}>个人资料</Menu.Item>
                </Menu>
              </div>
            }
            overlayStyle={{ width: '120px' }}
          >
            {this.props.user.avatar ? (
              <img src={this.props.user.avatar} className={styles.avatarImg} />
            ) : (
              <Iconfont type="portrait" className={styles.avatar} />
            )}
          </Dropdown>
          <Popover content={content} placement="bottomRight">
            <Iconfont
              type={
                Quality === '0'
                  ? 'Goodsignal'
                  : Quality === 'Signalgeneral'
                  ? '中'
                  : Quality === '2'
                  ? 'signalpoor'
                  : 'signal'
              }
            />
          </Popover>
          <SetUp />
        </div>
        {this.props.user.loading ? (
          <Spin />
        ) : (
          <User key={userKey} visible={userVisible} />
        )}
        <PerfectInformation
          key={perfectInformationKey}
          visible={perfectInformationVisible}
        />
      </div>
    );
  }
}

export default connect(({ live, user, common }) => ({
  live,
  user,
  ...common
}))(Header);
