/*
 * 表单控件装饰器，用来代理控件的name、rules、value值
 * @Author: 花豪（huahao.cy@alibaba-inc.com）
 * @Date: 2018-08-20 11:31:07
 * @Last Modified by: 花豪（huahao.cy@alibaba-inc.com）
 * @Last Modified time: 2018-10-16 19:08:26
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
      const { value } = this.props;
      const Child = React.Children.map(this.props.children, child => React.cloneElement(child, { value }));

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
    name: PropTypes.string,
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
