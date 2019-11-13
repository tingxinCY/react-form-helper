/*
 * 表单控件装饰器，用来代理控件的name、rules、value值
 * @Author: 花豪（huahao.cy@alibaba-inc.com）
 * @Date: 2018-08-20 11:31:07
 * @Last Modified by: 花豪（huahao.cy@alibaba-inc.com）
 * @Last Modified time: 2019-11-12 18:16:04
 */

import React, { Component } from 'react';
import PropTypes from 'prop-types';

import VFieldWrapper from './VFieldWrapper';

const createFieldDecorator = (FormContext) => {
  let salt = 0; // 表单控件全局盐值，用来给控件创建唯一key
  class FieldDecorator extends Component {
    constructor(props) {
      super(props);
      salt += 1;
      this.uniqueId = `key${salt}`;
    }

    render() {
      const { value, children } = this.props;
      let Child;
      if (typeof children === 'string') { // 支持纯文本node
        Child = children;
      } else {
        Child = React.Children.map(children, child => React.cloneElement(child, { value }));
      }
      return (
        <FormContext.Consumer>
          {contextProps => (
            <VFieldWrapper
              uniqueId={this.uniqueId}
              {...this.props}
              {...contextProps}
            >
              {Child}
            </VFieldWrapper>
          )}
        </FormContext.Consumer>
      );
    }
  }

  FieldDecorator.defaultProps = {
    rules: [],
  };

  FieldDecorator.propTypes = {
    name: PropTypes.string.isRequired, // name是数据收集必须字段，不设置则该Field无实际意义
    value: PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.number,
      PropTypes.array,
      PropTypes.bool,
    ]),
    rules: PropTypes.array,
  };

  return FieldDecorator;
};

export default createFieldDecorator;
