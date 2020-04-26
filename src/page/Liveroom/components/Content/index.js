import React, { Component } from 'react';
import { connect } from 'dva';
import styles from './index.less';
import WhiteBoard from '../../../WhiteBoard';
import ContentDoc from './components/content_Doc';
import none from '../../../../assets/file.png';

class Content extends Component {
  constructor(props) {
    super(props);
    this.state = {
      msg: '',
      type: 1
    };
  }

  render() {
    const { liveDetail, contentKey } = this.props;
    switch (contentKey) {
      case 1:
        return <ContentDoc liveDetail={liveDetail} />;
        break;
      case 2:
        return <WhiteBoard liveDetail={liveDetail} />;
        break;
      case 3:
        return (
          <div className={styles.content}>
            <p></p>
          </div>
        );
        break;
      default:
        return (
          <div
            className={styles.noneImg}
            style={{
              width: '100%',
              height: '100%',
              position: 'relative',
              background: '#f7f9fc'
            }}
          >
            <p
              style={{
                width: 269,
                height: 170,
                position: 'absolute',
                top: 0,
                left: 0,
                bottom: 0,
                right: 0,
                margin: 'auto'
              }}
            >
              <img src={none} style={{ height: 131 }} />
            </p>
          </div>
        );
        break;
    }
  }
}

export default connect(({ live, doc, common }) => ({
  ...live,
  ...doc,
  ...common
}))(Content);
