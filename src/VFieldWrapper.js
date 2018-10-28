import { Component } from 'react';
import Immutable, { is } from 'immutable';

/**
 * 通用表单组件高级函数，统一执行控件绑定、解绑、value校验
 */
class VFieldWrapper extends Component {
  componentWillMount() {
    const { bindField, uniqueId, name, rules, value } = this.props;
    bindField(uniqueId, name, rules, value);
  }

  componentWillReceiveProps(nextProps) {
    const { name, value, validateField, uniqueId, bindField, rules, options, parentProps } = nextProps;

    // 监控value变化，执行表单校验逻辑
    if (!is(Immutable.fromJS(value), Immutable.fromJS(this.props.value))) {
      validateField(uniqueId, value);

      // 当前表单全局hook
      // options.onValueChange && options.onValueChange(name, value, parentProps);
    }

    // 如果表单控件name值变化，需要重新绑定表单控件
    if (name !== this.props.name) {
      bindField(uniqueId, name, rules, value);
    }
  }

  shouldComponentUpdate(nextProps) {
    // 因为采用context技术方案，所以任何field触发校验之后都会触发context的更新，进而导致所有context.consumer执行render，所以此处判断必不可少，性能护航
    if (nextProps.name !== this.props.name
    || !is(Immutable.fromJS(nextProps.value), Immutable.fromJS(this.props.value))) {
      return true;
    }

    return false;
  }

  componentWillUnmount() {
    const { uniqueId, unbindField } = this.props;
    unbindField(uniqueId);
  }

  render() {
    return this.props.children || null;
  }
}

export default VFieldWrapper;
