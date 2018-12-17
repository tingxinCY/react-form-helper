/*
 * @Author: 花豪（huahao.cy@alibaba-inc.com）
 * @Date: 2018-08-17 12:19:53
 * @Last Modified by: 花豪（huahao.cy@alibaba-inc.com）
 * @Last Modified time: 2018-12-17 13:41:35
 * @reference https://github.com/yiminghe/async-validator
 */
import React, { Component } from 'react';
import Schema from 'async-validator';
import { Map, List, is } from 'immutable';

import createFieldDecorator from './FieldDecorator';

/**
 * 处理context中的数据，产出errors、values
 * @param {Object} fields 源数据表单字段
 * @param {Object} values 源数据表单值
 */
const processData = (fields, values) => {
  const errors = {};
  let valuesResult = Map();

  fields.forEach((field, key) => {
    const name = field.get('name');
    const error = field.get('error');
    if (error) {
      const errorName = name || key;
      errors[errorName] = error;
    }

    if (name) {
      const path = name.split('.');

      // 根据path，初始化value的Immutable对象，根据path每级路径，创建List或者Map
      for (let i = 1; i < path.length; i++) {
        const tmpPath = path.slice(0, i);
        if (valuesResult.getIn(tmpPath) === undefined) {
          const tmpValue = Number.isNaN(Number(path[i])) ? Map() : List();
          valuesResult = valuesResult.setIn(tmpPath, tmpValue);
        }
      }

      valuesResult = valuesResult.setIn(path, values.get(key));
    }
  });

  return {
    errors,
    valuesResult: valuesResult.toJS(),
  };
};

/**
 * hoc函数
 * @param {*} options validator配置
 */
const create = (options = {}) => {
  const FormContext = React.createContext({
    fields: Map(),
    values: Map(),
    bindField: () => {}, // 绑定控件
    unbindField: () => {}, // 解绑控件
    validateField: () => {}, // 校验字段
    options: {}, // validator全局配置信息
    parentProps: null, // 父级props
  });
  const FieldDecorator = createFieldDecorator(FormContext);

  return WrappedElement => class extends Component {
    constructor(props) {
      super(props);

      this.contextState = {
        fields: Map(),
        values: Map(),
        bindField: this.bindField,
        unbindField: this.unbindField,
        validateField: this.validateField,
        options,
        parentProps: props,
      };

      this.state = {
        fields: this.contextState.fields,
        values: this.contextState.values,
      };

      this.validator = {
        validateFields: this.validateFields, // 执行全局校验的函数
        reset: this.reset,
        errors: {}, // 全局表单字段validation状态集合对象
        FieldDecorator, // 表单控件注册装饰器
        getValues: this.getValues, // 获取表单数据对象
      };

      this.isReceiveProps = false; // 外在传入props时触发更新
    }

    componentWillReceiveProps() {
      this.isReceiveProps = true;
    }

    shouldComponentUpdate(nextProps, nextState) {
      // 判断校验结果，优化render性能，避免不必要的二次render
      if (!is(nextState.fields, this.state.fields)
      || this.isReceiveProps) {
        this.isReceiveProps = false;
        return true;
      }
      return false;
    }

    /**
     * 进行表单验证
     * @param descriptor 校验规则
     * @param source 源数据
     * @param cb 回调函数
     */
    doValidate = (descriptor, source, cb) => {
      let fields = this.contextState.fields;
      const values = this.contextState.values;
      Object.keys(descriptor).forEach((key) => {
        // 先重置当前字段的validate status
        fields = fields.setIn([key, 'error'], '');
      });

      // 执行校验
      const schema = new Schema(descriptor);
      schema.validate(source, (err) => {
        if (err) {
          err.forEach((item) => {
            if (!fields.getIn([item.field, 'error'])) {
              fields = fields.setIn([item.field, 'error'], item.message);
            }
          });
        }

        this.contextState.fields = fields;
        this.setState({ fields }); // 触发react重绘

        // 构建error集合和value集合，执行cb函数
        if (cb) {
          const { errors, valuesResult } = processData(fields, values);
          cb(errors, valuesResult);
        }
      });
    }

    /**
     * 验证全部表单
     * @param callback 表单验证的回调函数
     */
    validateFields = (callback) => {
      const fields = this.contextState.fields;
      const values = this.contextState.values;
      
      const rules = {};
      const source = {};
      fields.forEach((field, key) => {
        if (field.get('rules').length > 0) {
          rules[key] = field.get('rules');
        }

        if (values.get(key) !== undefined) {
          source[key] = values.get(key);
        }
      });
      
      if (Object.keys(rules).length > 0) {
        this.doValidate(rules, source, (cbError, cbValues) => {
          if (Object.keys(cbError).length === 0) {
            cbError = null;
          }

          callback && callback(cbError, cbValues);
        });
      } else {
        // 用来做数据收集
        const { valuesResult } = processData(fields, values);
        callback && callback(null, valuesResult);
      }
    }

    /**
     * 复位表单校验状态
     * @param [name] 表单name，如果未设置，则复位所有表单项
     */
    reset = (name) => {
      let fields = this.contextState.fields;
      fields.forEach((field, key) => {
        if ((name && field.get('name') === name) || name === undefined) {
          fields = fields.setIn([key, 'error'], '');
        }
      });

      this.contextState.fields = fields;
      this.setState({ fields });
    }

    /**
     * 绑定表单字段
     * @param uniqueId 唯一ID
     * @param name 字段名称
     * @param rules 字段验证规则，array
     * @param value 字段值,非undefined，所有表单控件必须为受控组件
     */
    bindField = (uniqueId, name = '', rules = [], value = '') => {
      const fields = this.contextState.fields;
      const values = this.contextState.values;

      const field = Map({
        name,
        rules,
        error: '',
      });

      const fieldValue = value === null ? '' : value;

      this.contextState.fields = fields.set(uniqueId, field);
      this.contextState.values = values.set(uniqueId, fieldValue);
    }

    /**
     * 解绑表单字段
     * @param key 唯一ID,uniqueId
     */
    unbindField = (key) => {
      const fields = this.contextState.fields;
      const values = this.contextState.values;

      if (fields.has(key)) {
        this.contextState.fields = fields.delete(key);
        this.contextState.values = values.delete(key);
      }
    }

    /**
     * 校验表单字段
     * @param key 唯一Id,uniqueId
     * @param value 字段值
     */
    validateField = (key, value = '') => {
      const fields = this.contextState.fields;
      let values = this.contextState.values;

      values = values.set(key, value);
      this.contextState.values = values;

      if (fields.has(key)) {
        const descriptor = {
          [key]: fields.getIn([key, 'rules']),
        };

        value = value === null ? '' : value;

        const source = {
          [key]: value,
        };

        this.doValidate(descriptor, source);
      }
    }

    /**
     * 获取加工好的values数据
     * @return values Object
     */
    getValues = () => {
      const fields = this.contextState.fields;
      const values = this.contextState.values;
      // const errors = {};
      // let valuesResult = Map();
      const { valuesResult } = processData(fields, values);
      return valuesResult;
    }

    render() {
      this.validator.errors = {};
      this.contextState.fields.forEach((field) => {
        this.validator.errors[field.get('name')] = field.get('error');
      });

      return (
        <FormContext.Provider value={this.contextState}>
          <WrappedElement validator={{ ...this.validator }} {...this.props} />
        </FormContext.Provider>
      );
    }
  };
};

export default create;
