// 判断当前系统
export function currentOs() {
  let agent = navigator.userAgent.toLowerCase();
  let isMac = /macintosh|mac os x/i.test(navigator.userAgent);

  let os = '';

  if (agent.indexOf('win') >= 0 || agent.indexOf('wow') >= 0) {
    os = 'win';
  } else if (isMac) {
    os = 'mac';
  }

  return os;
}

// 毫秒转换成时分秒，小于十补零
export function secondToDate(time) {
  // 先将毫秒转成秒
  let result = parseInt(time / 1000);

  let h =
    Math.floor(result / 3600) < 10
      ? '0' + Math.floor(result / 3600)
      : Math.floor(result / 3600);
  let m =
    Math.floor((result / 60) % 60) < 10
      ? '0' + Math.floor((result / 60) % 60)
      : Math.floor((result / 60) % 60);
  let s =
    Math.floor(result % 60) < 10
      ? '0' + Math.floor(result % 60)
      : Math.floor(result % 60);

  return (result = h + ':' + m + ':' + s);
}

// 阿拉伯数组输出对应的中文计算数
export function numberENFun(num) {
  let numberCN = ['一', '二', '三', '四', '五', '六', '七', '八', '九', '十'];
  let string = num.toString();

  let resultStr = '';
  string.split('').forEach(function(item, i) {
    // console.log(item,i);

    if (i == 1) {
      if (item * 1 != 0) {
        resultStr += '十' + numberCN[item * 1 - 1];
      } else {
        resultStr += '十';
      }
    } else {
      resultStr += numberCN[item * 1 - 1];
    }
  });

  if (resultStr == '一十') {
    resultStr = '十';
  }
  return resultStr;
}
