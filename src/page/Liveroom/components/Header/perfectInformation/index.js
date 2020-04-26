import React, { PureComponent } from 'react';
import { Modal, Button, Icon } from 'antd';
import { connect } from 'dva';
import Iconfont from '@/components/Iconfont';
import styles from './index.less';

class PerfectInformation extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      showModal: this.props.visible,
      userVisible: false
    };
  }

  //关闭弹窗
  handleCancel = e => {
    this.setState({
      showModal: false
    });
  };
  // 打开个人资料页面
  handleOk = e => {
    this.showUserModal();
    this.handleCancel();
  };
  showUserModal() {
    this.props.dispatch({
      type: 'user/userVisible',
      visible: true
    });
  }
  componentWillUnmount() {}
  render() {
    const {} = this.props;
    const { showModal, userVisible } = this.state;
    return (
      <>
        <Modal
          className={styles.setEquipmentModal}
          centered={true}
          visible={showModal}
          footer={[
            <Button onClick={this.handleCancel}>稍后再说</Button>,
            <Button type="primary" onClick={this.handleOk}>
              立即修改
            </Button>
          ]}
          width={460}
          onCancel={this.handleCancel}
          zIndex={1000}
          destroyOnClose={true}
        >
          <div>
            <div className={styles.title}>
              <Icon
                type="exclamation-circle"
                theme="filled"
                style={{ color: '#0d6fde' }}
              />
              <span>完善个人资料</span>
            </div>
            <div className={styles.content}>
              我们建议您在开播前，先完善个人资料，便于观众更好的了解您。
            </div>
          </div>
        </Modal>
      </>
    );
  }
}
export default connect(({ user }) => ({
  ...user
}))(PerfectInformation);
