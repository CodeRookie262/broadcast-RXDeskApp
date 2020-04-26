import React from 'react';
import { connect } from 'dva';
import { Button, Form, Input, Modal, Icon } from 'antd';

class Password extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loginBtn: true
    };
  }

  componentDidMount() {
    // To disabled submit button at the beginning.
    this.props.form.validateFields();
  }

  // 自定义验证
  comfirmRules = (rule, value, callback) => {
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;
    if (value) {
      if (phoneRules.test(value) || emailRules.test(value)) {
        callback();
      } else {
        callback('请输入正确格式的手机号或邮箱');
      }
    } else {
      callback('手机号或邮箱不能为空');
    }
  };

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
      className: 'deleteModal'
    });
  };

  loginRequest = json => {
    this.props.dispatch({
      type: 'login/login',
      payload: json,
      callback: res => {
        // console.log('res====', res);
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
      }
    });
  };

  // 登录
  handleSubmit = e => {
    e.preventDefault();
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;

    this.props.form.validateFields((err, values) => {
      // console.log(values);
      if (!err) {
        // 判断是手机号还是邮箱
        if (phoneRules.test(values.username)) {
          //手机号
          this.loginRequest({
            room_id: values.roomid,
            password: values.password,
            phone: values.username
          });
        } else if (emailRules.test(values.username)) {
          //邮箱
          this.loginRequest({
            room_id: values.roomid,
            password: values.password,
            email: values.username
          });
        }
      }
    });
  };

  // 校验错误
  hasErrors = fieldsError => {
    return Object.keys(fieldsError).some(field => fieldsError[field]);
  };

  onChange = () => {
    this.setState({ loginBtn: false });
  };

  render() {
    const {
      getFieldDecorator,
      getFieldsError,
      getFieldError,
      isFieldTouched
    } = this.props.form;

    const { loadingLogin } = this.props.login;
    const { loginBtn } = this.state;

    // Only show error after a field is touched.
    const roomidError = isFieldTouched('roomid') && getFieldError('roomid');
    const usernameError =
      isFieldTouched('username') && getFieldError('username');
    const passwordError =
      isFieldTouched('password') && getFieldError('password');

    return (
      <Form onSubmit={this.handleSubmit} style={{ maxWidth: 364 }}>
        <Form.Item
          validateStatus={roomidError ? 'error' : ''}
          help={roomidError || ''}
        >
          {getFieldDecorator('roomid', {
            rules: [
              { required: true, message: '直播房间号不能为空' },
              {
                pattern: /^[0-9]{6}$/,
                message: '直播房间号须为6位数字组成'
              }
            ]
          })(
            <Input
              placeholder="请输入直播房间号"
              size="large"
              maxLength={6}
              onChange={this.onChange}
            />
          )}
        </Form.Item>
        <Form.Item
          validateStatus={usernameError ? 'error' : ''}
          help={usernameError || ''}
        >
          {getFieldDecorator('username', {
            rules: [
              {
                validator: this.comfirmRules
              }
            ]
          })(
            <Input
              placeholder="请输入手机号或邮箱"
              size="large"
              onChange={this.onChange}
            />
          )}
        </Form.Item>
        <Form.Item
          validateStatus={passwordError ? 'error' : ''}
          help={passwordError || ''}
        >
          {getFieldDecorator('password', {
            rules: [
              { required: true, message: '密码不能为空' },
              {
                pattern: /^[a-zA-Z0-9!@#\$%\^&\*_\+-=,\.\/?;:`"~'\\\(\)\{\}\[\]<>]{6,16}$/,
                message:
                  '密码为数字，大写字母，小写字母，或特殊符号组成，长度为6至16位'
              }
            ]
          })(
            <Input.Password
              placeholder="请输入密码"
              size="large"
              onChange={this.onChange}
            />
          )}
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            size="large"
            loading={loadingLogin}
            disabled={loginBtn ? loginBtn : this.hasErrors(getFieldsError())}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

const PasswordForm = Form.create({ name: 'Password_login' })(Password);

export default connect(({ login }) => ({
  login
}))(PasswordForm);
