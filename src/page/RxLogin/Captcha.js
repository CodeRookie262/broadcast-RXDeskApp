import React from 'react';
import { connect } from 'dva';
import { Link } from 'react-router-dom';
import { Button, Form, Input, Row, Col, Modal, Icon } from 'antd';
import styles from './index.less';

class Captcha extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      getCodeBtn: true,
      codeBtn: '获取验证码',
      // key: 'check',
      status: 0,
      loginBtn: true,
    };
  }

  componentDidMount() {
    // To disabled submit button at the beginning.
    // this.props.form.validateFields();
  }

  // 自定义验证
  comfirmRules = (rule, value) => {
    const { status, codeBtn } = this.state;
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;
    if (value) {
      if (phoneRules.test(value) || emailRules.test(value)) {
        if (
          status === 0 &&
          (codeBtn === '获取验证码' || codeBtn === '重新获取')
        ) {
          this.setState({ getCodeBtn: false, status: 1 });
          return Promise.resolve();
        } else {
          return Promise.resolve();
        }
      } else {
        if (
          status === 1 &&
          (codeBtn === '获取验证码' || codeBtn === '重新获取')
        ) {
          this.setState({ getCodeBtn: true, status: 0 });
          return Promise.reject('请输入正确格式的手机号或邮箱');
        } else {
          return Promise.reject('请输入正确格式的手机号或邮箱');
        }
      }
    } else {
      this.setState({ getCodeBtn: true });
      return Promise.reject('手机号或邮箱不能为空');
    }
  };

  forCode = (obj) => {
    // 发送请求
    this.setState({ getCodeBtn: true });
    this.props.dispatch({
      type: 'login/getCaptcha',
      payload: obj,
      callback: (res) => {
        // console.log("getCode:", res);
        //60秒倒计时
        let countdown = 60;
        this.timer = setInterval(() => {
          countdown--;
          if (countdown <= 0) {
            clearInterval(this.timer);
            this.setState({
              getCodeBtn: false,
              codeBtn: '重新获取',
            });
            countdown = 60;
            return;
          } else {
            this.setState({
              getCodeBtn: true,
              codeBtn: countdown + 's' + ' ' + '后重新获取',
            });
          }
        }, 1000);
      },
      failCallback: () => {
        this.setState({ getCodeBtn: false });
      },
    });
  };

  // 获取验证码
  getCode = (e) => {
    e.preventDefault();
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;

    this.refs.loginCaptcha.validateFields(['username']).then((values) => {
      // console.log(values);
      // 判断是手机号还是邮箱
      if (phoneRules.test(values.username)) {
        //手机号
        this.forCode({ send_type: 6, phone: values.username });
      } else if (emailRules.test(values.username)) {
        //邮箱
        this.forCode({ send_type: 5, email: values.username });
      }
    });
    // this.refs.loginCaptcha.validateFields(['username'], (err, values) => {
    //   // console.log(values);
    //   if (!err) {
    //     // 判断是手机号还是邮箱
    //     if (phoneRules.test(values.username)) {
    //       //手机号
    //       this.forCode({ send_type: 6, phone: values.username });
    //     } else if (emailRules.test(values.username)) {
    //       //邮箱
    //       this.forCode({ send_type: 5, email: values.username });
    //     }
    //   }
    // });
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
      className: 'deleteModal',
    });
  };

  loginRequest = (json) => {
    return console.log('验证码登录:', json);
    this.props.dispatch({
      type: 'login/login',
      payload: json,
      callback: (res) => {
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
      },
    });
  };

  // 登录
  handleSubmit = (e) => {
    let phoneRules = /^1[3456789]\d{9}$/;
    let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;
    this.refs.loginCaptcha
      .validateFields(['username', 'VerificationCode'])
      .then((values) => {
        console.log(values, '个大胜靠德');
        if (phoneRules.test(values.username)) {
          //手机号
          this.loginRequest({
            // room_id: values.roomid,
            captcha: values.VerificationCode,
            phone: values.username,
          });
        } else if (emailRules.test(values.username)) {
          //邮箱
          this.loginRequest({
            // room_id: values.roomid,
            captcha: values.VerificationCode,
            email: values.username,
          });
        }
      })
      .catch((e) => console.log('fail', e));
    return;
    // const { ipcRenderer } = window.electron;
    // ipcRenderer.send('update');
    // e.preventDefault();
    // let phoneRules = /^1[3456789]\d{9}$/;
    // let emailRules = /^[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?$/;

    // this.props.form.validateFields((err, values) => {
    //   // console.log(values);
    //   if (!err) {
    //     // 判断是手机号还是邮箱
    //     if (phoneRules.test(values.username)) {
    //       //手机号
    //       this.loginRequest({
    //         // room_id: values.roomid,
    //         captcha: values.VerificationCode,
    //         phone: values.username,
    //       });
    //     } else if (emailRules.test(values.username)) {
    //       //邮箱
    //       this.loginRequest({
    //         // room_id: values.roomid,
    //         captcha: values.VerificationCode,
    //         email: values.username,
    //       });
    //     }
    //   }
    // });
  };

  // 组件卸载时清理定时器等
  componentWillUnmount() {
    this.timer && clearInterval(this.timer);
  }

  // 校验错误
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
    // const {
    //   getFieldDecorator,
    //   getFieldsError,
    //   getFieldError,
    //   isFieldTouched,
    // } = this.props.form;
    const { getCodeBtn, codeBtn, loginBtn } = this.state;
    const { loadingCaptcha, loadingLogin } = this.props.login;

    // Only show error after a field is touched.
    // const roomidError = isFieldTouched('roomid') && getFieldError('roomid');
    // const usernameError =
    //   isFieldTouched('username') && getFieldError('username');
    // const codeError =
    //   isFieldTouched('VerificationCode') && getFieldError('VerificationCode');

    return (
      <Form
        ref="loginCaptcha"
        onFinish={this.handleSubmit}
        onFieldsChange={this.hasErrors}
        style={{ maxWidth: 364 }}
      >
        <Form.Item
          name="username"
          // validateStatus={usernameError ? 'error' : ''}
          // help={usernameError || ''}
          rules={[
            {
              validator: this.comfirmRules,
            },
          ]}
        >
          <Input
            placeholder="请输入手机号或邮箱"
            size="large"
            onChange={this.onChange}
          />
        </Form.Item>
        <Form.Item
          name="VerificationCode"
          rules={[
            { required: true, message: '验证码不能为空' },
            {
              pattern: /^[0-9]{4}$/,
              message: '验证码须为四位数字组成',
            },
          ]}
        >
          <Row gutter={8}>
            <Col span={15}>
              <Input
                size="large"
                placeholder="请输入验证码"
                maxLength={4}
                onChange={this.onChange}
              />
            </Col>
            <Col span={9} style={{ textAlign: 'right' }}>
              <Button
                disabled={getCodeBtn}
                type="primary"
                onClick={this.getCode}
                style={{ width: '100%' }}
                size="large"
                loading={loadingCaptcha}
              >
                {codeBtn}
              </Button>
            </Col>
          </Row>
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
            // disabled={loginBtn ? loginBtn : this.hasErrors(getFieldsError())}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

// const CaptchaForm = Form.create({ name: 'Captcha_login' })(Captcha);

export default connect(({ login }) => ({
  login,
}))(Captcha);
