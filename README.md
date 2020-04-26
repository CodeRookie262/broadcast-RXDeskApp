英荔播课-桌面应用，提供观众观看直播的工具。使用 electron + create-react-app + dva + 即构 sdk 开发。

## 环境要求

- node: 10.4.0

## 项目安装

```bash
git clone 仓库地址

// 安装
npm install
```

## 本地启动

```bash
npm run start

// 需要等启动成功后，再跑这个命令
npm run electron-dev
```

## 本地配置

- 配置本地代理， 修改 setupProxy.js

```js
app.use(
  proxy('/api', {
    target: 'http://beta.yingliboke.cn/',
    changeOrigin: true
  })
);
```

- 自定义端口
  本地开发中, `npm run start`先跑起一个页面，默认是`locahost:8000`。`npm run electron-dev`，用 electron 窗口加载`localhost:8000`这个页面。
  当你本地的 8000 端口被占用，则需要修改端口号。假设确定`npm run start`跑起来的是`loaclhost:1234`， 在/public/electron.js 中，搜索并替换`http://localhost:8000` 为 `http://localhost:1234`

### 打包

1. 打包生成 dmg、exe， 成功后可以在 /dist 找到安装包

```bash
npm run pkg

```

2. 调试打包后的应用

```bash
npm run electron
```

3. 修改打包后请求的绝对路径 /src/utils/request.js

```js
// 打包后的axios配置
const host =
  process.env.NODE_ENV === 'development' ? '' : 'http://beta.yingliboke.cn/';
```
