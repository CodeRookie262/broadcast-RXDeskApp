import React from 'react';
import { connect } from 'dva';
import { Modal, Button, Row, Col, Input, message } from 'antd';
import styles from './index.less';
import Iconfont from '@/components/Iconfont';
import ReactQuill from 'react-quill';
import { uploadFile, checkFileType } from '@/utils/upload';
import 'react-quill/dist/quill.snow.css';
import { getBase64 } from '../../../../../utils/upload';

class User extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      visible: this.props.visible,
      len: 0,
      avatar: this.props.user.avatar,
      // brief: this.props.user.brief,
      brief: '',
      name: this.props.user.name
    };
    this.uploadInput = React.createRef();
    this.file = null;
  }

  componentDidMount() {
    const { user } = this.props;

    if (this.props.user.brief) {
      let arr = user.brief.split(' || ');

      this.setState({
        brief: arr[0],
        len: arr[1]
      });
    }
  }

  hideModal = () => {
    this.props.dispatch({
      type: 'user/userVisible',
      visible: false
    });
    this.setState({
      visible: false
    });
  };

  ChangeReactQuill = value => {
    let that = this;
    if (this.reactQuillRef != undefined) {
      const currentLen = that.reactQuillRef.getEditor().getLength();
      // console.log('currentLen====', currentLen);
      that.setState({
        brief: value,
        len: currentLen - 1
      });
    } else {
      this.setState({
        brief: value,
        len: value.length
      });
    }
  };

  changeAvatar = () => {
    this.uploadInput.click();
  };

  handleFileChange = e => {
    const that = this;
    const file = e.target.files[0];
    if (checkFileType(file)) {
      getBase64(file, result => {
        this.setState({
          avatar: result
        });
      });
      this.file = file;
    }
  };

  handleNameChange = e => {
    this.setState({ name: e.target.value });
  };

  handleSubmit = () => {
    this.props.dispatch({
      type: 'user/userVisible',
      visible: false
    });
    const { name, brief, len } = this.state;
    const { id } = this.props.user;
    const that = this;

    if (this.file) {
      uploadFile(this.file).then(res => {
        const avatar = res.host + res.data.fid;

        that.handleSave({
          name,
          brief: brief + ' || ' + len,
          avatar,
          id
        });
        that.uploadInput.value = '';
      });
    } else {
      this.handleSave({
        name,
        brief: brief + ' || ' + len,
        id
      });
    }
  };

  handleSave = data => {
    const { len } = this.state;

    if (len > 200) {
      message.error('个人简介不能大于200字');
    } else {
      this.props.dispatch({
        type: 'user/updateUserInfo',
        payload: data,
        callback: () => {
          message.success('个人资料保存成功');
          this.hideModal();
        }
      });
    }
  };

  render() {
    const { visible, len, avatar, brief, name } = this.state;

    const modules = {
      toolbar: [
        [{ header: [1, 2, false] }],
        ['align'],
        ['bold', 'italic', 'underline', 'strike'],
        ['color', 'background'],
        ['blockquote', 'code-block'],
        [
          { list: 'ordered' },
          { list: 'bullet' },
          { indent: '-1' },
          { indent: '+1' }
        ],
        ['link']
      ]
    };

    const formats = [
      'header',
      'align',
      'bold',
      'italic',
      'underline',
      'strike',
      'color',
      'background',
      'blockquote',
      'code-block',
      'list',
      'bullet',
      'indent',
      'link'
    ];
    return (
      <Modal
        visible={visible}
        footer={null}
        onCancel={this.hideModal.bind(this)}
        bodyStyle={{
          padding: '50px 20px 5px',
          textAlign: 'center'
        }}
        width="537px"
        wrapClassName={styles.modal}
        destroyOnClose={true}
      >
        <h3>修改个人资料</h3>
        {avatar ? (
          <img src={avatar} className={styles.avatarImg} />
        ) : (
          <Iconfont type="portrait" className={styles.avatar} />
        )}
        <div>
          <Button
            type="primary"
            ghost
            className={styles.btn}
            onClick={this.changeAvatar.bind(this)}
          >
            更换头像
          </Button>
          <input
            type="file"
            onChange={e => this.handleFileChange(e)}
            ref={node => (this.uploadInput = node)}
            style={{ display: 'none' }}
          />
        </div>
        <Row>
          <Col span={3} style={{ lineHeight: '32px' }}>
            称呼
          </Col>
          <Col span={21}>
            <Input
              placeholder="请输入您的姓名或昵称"
              onChange={this.handleNameChange.bind(this)}
              maxLength={10}
              value={name}
            />
          </Col>
        </Row>
        <div className={styles.textBox}>
          <ReactQuill
            className={styles.textArea}
            theme="snow"
            modules={modules}
            formats={formats}
            value={brief}
            onChange={this.ChangeReactQuill}
            ref={el => (this.reactQuillRef = el)}
          ></ReactQuill>
          <span
            className={styles.textLen}
            style={{ color: len > 200 ? 'red' : '#8494a6' }}
          >
            {len ? len : 0}/200
          </span>
        </div>
        <Button
          type="primary"
          className={styles.btn}
          onClick={this.handleSubmit}
        >
          保存
        </Button>
      </Modal>
    );
  }
}

export default connect(({ user }) => ({
  user
}))(User);
