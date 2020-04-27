import React from 'react';
import { connect } from 'dva';
import { withRouter, Link } from 'react-router-dom';
import { Button, Form, Input, Modal, Icon } from 'antd';
import styles from './index.less';

const { ipcRenderer } = window.electron;

class Password extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginBtn: true,
    };
  }

  componentDidMount() {
    console.log(this.props, 'haha');
  }

  // 自定义验证
  comfirmRules(rule, value) {
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;
    if (value) {
      if (phoneRules.test(value) || emailRules.test(value)) {
        console.log(value);
        return Promise.resolve();
      } else {
        return Promise.reject('请输入正确格式的手机号或邮箱');
      }
    }
  }

  // 弹窗
  ErrorModal = (title, msg) => {
    Modal.warning({
      title: title,
      content: msg,
      centered: true,
      okText: '关闭',
      icon: (
        <Icon
          type="exclamation-circle"
          theme="filled"
          style={{ color: '#faad14' }}
        />
      ),
      className: 'deleteModal',
    });
  };

  loginRequest = (json) => {
    return console.log('RXDeskTop 登录:', json);
    this.props.dispatch({
      type: 'login/login',
      payload: json,
      callback: (res) => {
        console.log('res====', res);
        if (res.code === 30016) {
          // 未支付
          this.ErrorModal(
            '组织未完成支付',
            '您的组织还未对本场直播完成支付，请联系组织负责人或我们的销售代表 400-931-8118'
          );
        } else if (res.code === 20030) {
          // 组织未通过审核
          this.ErrorModal(
            '组织未认证',
            '您的组织还未认证，请前往直播管理后台认证或联系我们的销售代表 400-931-8118'
          );
        } else if (res.code === 20038) {
          this.ErrorModal(
            '组织被冻结',
            '您账号关联的组织被冻结，如需解冻请联系 400-931-8118'
          );
        }
      },
    });
  };

  // 登录
  handleSubmit = (e) => {
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;

    this.refs.loginPassword
      .validateFields(['username', 'password'])
      .then((values) => {
        if (phoneRules.test(values.username)) {
          //手机号
          this.loginRequest({
            // room_id: values.roomid,
            password: values.password,
            phone: values.username,
          });
        } else if (emailRules.test(values.username)) {
          //邮箱
          this.loginRequest({
            // room_id: values.roomid,
            password: values.password,
            email: values.username,
          });
        }
      })
      .catch((e) => console.log('fail', e));
    return;
    this.refs.loginPassword.validateFields((err, values) => {
      // console.log(values);
      if (!err) {
        // 判断是手机号还是邮箱
        if (phoneRules.test(values.username)) {
          //手机号
          this.loginRequest({
            // room_id: values.roomid,
            password: values.password,
            phone: values.username,
          });
        } else if (emailRules.test(values.username)) {
          //邮箱
          this.loginRequest({
            // room_id: values.roomid,
            password: values.password,
            email: values.username,
          });
        }
      }
    });
  };

  // 校验错误
  hasErrors = (_, allFields) => {
    // console.log(
    //   allFields,
    //   'allFields',
    //   allFields.some((field) => field.errors.length > 0 || !field.value)
    // );
    this.setState({
      loginBtn: allFields.some(
        (field) => field.errors.length > 0 || !field.value
      ),
    });
  };

  onChange = () => {
    this.setState({ loginBtn: false });
  };

  render() {
    const { loadingLogin } = this.props.login;
    const { loginBtn } = this.state;

    return (
      <Form
        onFinish={this.handleSubmit}
        onFieldsChange={this.hasErrors}
        style={{ maxWidth: 364, margin: 'auto' }}
        ref="loginPassword"
      >
        <Form.Item
          name="username"
          rules={[
            {
              required: true,
              message: '手机号或邮箱不能为空',
              validator: this.comfirmRules,
            },
          ]}
        >
          <Input
            placeholder="请输入手机号或邮箱"
            size="large"
            // onChange={this.onChange}
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '密码不能为空' },
            {
              validator(rule, value) {
                if (value) {
                  if (
                    /^[a-zA-Z0-9!@#\$%\^&\*_\+-=,\.\/?;:`"~'\\\(\)\{\}\[\]<>]{6,16}$/.test(
                      value
                    )
                  ) {
                    // console.log(value);
                    return Promise.resolve();
                  } else {
                    return Promise.reject(
                      '密码为数字，大写字母，小写字母，或特殊符号组成，长度为6至16位'
                    );
                  }
                }
              },
            },
          ]}
        >
          <Input.Password placeholder="请输入密码" size="large" />
        </Form.Item>
        <div className={styles.f_nav}>
          <span>
            <Link to="/reg">快速注册</Link>
          </span>
          <span>
            <Link to="/reg">忘记密码</Link>
          </span>
        </div>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            size="large"
            loading={loadingLogin}
            disabled={loginBtn}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default connect(({ login }) => ({
  login,
}))(withRouter(Password));
