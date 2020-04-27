import React, { Component } from 'react';
import { Link, withRouter } from 'react-router-dom';
// import router from 'umi/router';
// import { shell } from 'electron';
import {
  Row,
  Col,
  Form,
  Icon,
  Input,
  Button,
  Checkbox,
  message,
  Modal,
  AutoComplete,
} from 'antd';
import { connect } from 'dva';
import styles from './index.less';
const { shell, ipcRenderer } = window.electron;

@connect(({ user }) => ({
  user,
}))
class PhoneReg extends Component {
  constructor(props) {
    super(props);
    this.state = {
      getCodeBtn: true,
      codeBtn: '获取验证码',
      isChecked: false,
      seconds: 3,
      key: 0,
    };
    this.timer = null;
    console.log(this.props);
  }
  componentDidMount() {
    if (this.props.history.location.state) {
      if (/^\d{1,}$/.test(this.props.history.location.state.username)) {
        const { setFieldsValue } = this.refs.reg;
        setFieldsValue({
          phone: this.props.history.location.state.username,
        });
        this.setState({
          getCodeBtn: false,
        });
      }
    }
  }
  forCode = (obj) => {
    // 发送请求
    this.setState({ getCodeBtn: true });
    console.log('请求验证码咯');
    // return console.log('请求验证码:', obj);
    this.props.dispatch({
      type: 'user/getCaptcha',
      payload: obj,
      callback: (res) => {
        // console.log("getCode:", res);
        message.success('我们给你发送了一条短信，请查收其中的验证码');

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
    // ipcRenderer.send('newwin', {
    //   width: 433,
    //   height: 192,
    //   minWidth: 433,
    //   minHeight: 192,
    //   hash: 'sign',
    // });

    //已验证,可行
    // ipcRenderer.send('hideLoginWindow', { hide: true });

    // setTimeout(() => {
    //   ipcRenderer.send('hideLoginWindow', { hide: false });
    //   // remote.getCurrentWindow().show();
    // }, 10000);

    e.preventDefault();
    // 手机验证码
    this.refs.regPhone.validateFields(['phone']).then((values) => {
      console.log(values);
      // if (!err) {
      this.forCode({ send_type: 3, phone: values.phone });
      // }
    });
  };

  CheckboxChange = (e) => {
    // console.log(e.target.checked)
    this.setState({ isChecked: e.target.checked });
  };

  userAagreement(e) {
    e.preventDefault();
    shell.openExternal('https://www.yingliboke.cn/terms/user_agreement/');
  }

  privacy(e) {
    e.preventDefault();
    shell.openExternal('https://www.yingliboke.cn/terms/privacy/');
  }

  // 注册请求
  regRequest = (obj) => {
    return console.log('注册请求:', obj);
    this.props.dispatch({
      type: 'user/userRegister',
      payload: obj,
      callback: (res) => {
        if (res.code === 20000) {
          this.props.dispatch({
            type: 'user/userLogin',
            payload: {
              username: obj.phone,
              password: obj.password,
            },
            callback: (response) => {
              if (response.code === 20000) {
                localStorage.setItem('token', response.data.token);
                window.location.href = '/forget/registerOrg';
              } else if (response.code === 20012) {
                Modal.confirm({
                  title: '账号不存在',
                  icon: (
                    <Icon
                      type="exclamation-circle"
                      theme="filled"
                      style={{ color: '#faad14' }}
                    />
                  ),
                  centered: true,
                  content:
                    '您输入的账号还未注册，是否现在注册账号以登录使用英荔播课',
                  okText: '立即注册',
                  cancelText: '取消',
                  onOk: () => {
                    // router.push('/user/register');

                    this.props.history.push('/');
                  },
                });
              } else if (response.code === 20013) {
                message.error('密码错误');
              } else if (response.code === 20014) {
                message.error('手机号码或邮箱格式错误');
              } else {
                message.error('登录失败');
              }
            },
          });
        }
      },
    });
  };

  // 点击注册
  handleSubmit = (e) => {
    // e.preventDefault();
    //手机注册
    console.log(this.refs.regPhone);
    this.refs.regPhone
      .validateFields(['VerificationCode', 'phone', 'password'])
      .then((values) => {
        // console.log(values, 'hhh');
        // if (!err) {
        this.regRequest({
          phone: values.phone,
          password: values.password,
          // confirm_password: values.confirm,//第二次密码
          captcha: values.VerificationCode,
          bind: false,
        });
        // }
      });
  };

  // 手机号自定义验证
  phoneRules = (rule, value) => {
    const { key, codeBtn } = this.state;
    let reg = new RegExp(/^1[3456789]\d{9}$/);
    if (value) {
      if (reg.test(value)) {
        if (key === 0 && (codeBtn === '获取验证码' || codeBtn === '重新获取')) {
          this.setState({ getCodeBtn: false, key: 1 });
          return Promise.resolve();
        } else {
          return Promise.resolve();
        }
      } else {
        if (key === 1 && (codeBtn === '获取验证码' || codeBtn === '重新获取')) {
          this.setState({ getCodeBtn: true, key: 0 });
          return Promise.reject('请输入正确格式的手机号码');
        } else {
          return Promise.reject('请输入正确格式的手机号码');
        }
      }
    } else {
      this.setState({ getCodeBtn: true });
      return Promise.reject('手机号码不能为空');
    }
  };

  // 组件卸载时清理定时器等
  componentWillUnmount() {
    this.timeOuter && clearTimeout(this.timeOuter);
    this.timer && clearInterval(this.timer);
  }

  render() {
    // const { getFieldDecorator } = this.refs.regPhone;
    const { getCodeBtn, codeBtn, isChecked } = this.state;
    const { loadingCaptcha, loadingRegister } = this.props.user;

    const prefixSelector = <span>+86</span>;

    return (
      <Form ref="regPhone" onFinish={this.handleSubmit} className="login-form">
        <Form.Item
          name="phone"
          rules={[
            {
              validator: this.phoneRules,
            },
          ]}
        >
          <AutoComplete size="large">
            <Input addonBefore={prefixSelector} placeholder="请输入手机号码" />
          </AutoComplete>
        </Form.Item>
        <Form.Item
          name="VerificationCode"
          rules={[
            { required: true, message: '验证码不能为空' },
            {
              pattern: /\d{4}/,
              message: '请输入正确格式的验证码',
            },
          ]}
        >
          <Row gutter={8}>
            <Col span={15}>
              <AutoComplete size="large" placeholder="请输入验证码">
                <Input maxLength={4} />
              </AutoComplete>
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
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '密码不能为空' },
            {
              pattern: /^[a-zA-Z0-9!@#\$%\^&\*_\+-=,\.\/?;:`"~'\\\(\)\{\}\[\]<>]{6,16}$/,
              message:
                '密码为数字、大小写字母或特殊符号组成，长度为 6 至 16 位',
            },
          ]}
        >
          <AutoComplete placeholder="请输入密码" size="large">
            <Input.Password />
          </AutoComplete>
        </Form.Item>
        <Row gutter={8} style={{ marginBottom: 20, fontSize: 14 }}>
          <Col span={24} className={styles.notice}>
            <Checkbox onChange={this.CheckboxChange} defaultChecked={isChecked}>
              我已阅读并接受
            </Checkbox>
            <span
              to="/"
              style={{ marginLeft: '-3%' }}
              onClick={this.userAagreement}
            >
              《用户协议》、
            </span>
            <span to="/" style={{ marginLeft: '-3%' }} onClick={this.privacy}>
              《隐私政策》
            </span>
          </Col>
          {/* <Col span={8} style={{ textAlign: 'center' }}>
            已经有账号？
            <Link to="/user/login">去登录</Link>
          </Col> */}
        </Row>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            style={{ width: '100%' }}
            size="large"
            disabled={isChecked === false ? true : false}
            loading={loadingRegister}
          >
            立即注册
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

// export default Form.create({ name: 'register-phone' })(withRouter(PhoneReg));
export default withRouter(PhoneReg);
