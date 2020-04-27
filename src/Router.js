import React from 'react';
import { HashRouter, Switch, Route } from 'react-router-dom';
import { ConfigProvider } from 'antd';
import enUS from 'antd/es/locale/en_US';
import zhCN from 'antd/es/locale/zh_CN';
import moment from 'moment';
import 'moment/locale/zh-cn';
import Liveroom from './page/Liveroom';
import LiveList from './page/LiveList';
import Login from './page/Login';
import WhiteBoard from './page/WhiteBoard';
import DeviceProbing from './page/DeviceProbing';
import Chat from './page/Liveroom/components/Questions/Chat';

import RxLogin from './page/RxLogin';
import RxReg from './page/RxReg';
moment.locale('zh-cn');

export default function AppRouter() {
  return (
    <ConfigProvider locale={zhCN}>
      <HashRouter hashType="noslash">
        <Route exact path="/" component={RxLogin || Login} />
        <Route exact path="/reg" component={RxReg} />
        <Route path="/livelist" component={LiveList} />
        <Route path="/liveroom" component={Liveroom} />
        <Route path="/whiteboard" component={WhiteBoard} />
        <Route path="/deviceProbing" component={DeviceProbing} />
        <Route path="/question" component={Chat} />
      </HashRouter>
    </ConfigProvider>
  );
}
