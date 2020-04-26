import React, { PureComponent } from 'react';
import styles from './index.less';
import SetEquipment from './components/SetEquipment';

class Footer extends PureComponent {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    return (
      <div className={styles.panel}>
        <SetEquipment />
      </div>
    );
  }
}
export default Footer;
