import React from "react";
import styles from "./index.less";
require("@/libs/iconfont.js");

export default function Iconfont(props) {
  return (
    <svg
      {...props}
      className={`${styles.iconfont} ${props.className}`}
      aria-hidden="true"
    >
      <use xlinkHref={`#icon-${props.type}`}></use>
    </svg>
  );
}
