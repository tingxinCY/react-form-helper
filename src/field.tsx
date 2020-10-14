import React from 'react';
import { TBindFieldFunction, TUnbindFieldFunction, TOnFieldValueChangeFunction } from './index';

export interface IRule {
  type?: 'string'|'number'|'integer'|'float'|'boolean'|'url'|'email'|'enum';
  required?: boolean;
  pattern?: RegExp|string;
  min?: number;
  max?: number;
  length?: number;
  whitespace?: boolean;
  asyncValidator?: (
    rule: {[key:string]: IRule|IRule[]},
    value:any,
    callback:(error?: string) => void,
    source: {[key: string]: any}
  ) => void;
  validator?: (
    rule: {[key: string]: IRule|IRule[]},
    value: any,
    callback: (error?: string)=>void,
    source: {[key: string]: any}
  ) => void;
  message?: string;
}
export type TValue = string|number|boolean;

interface IFieldOptions {
  bindField: TBindFieldFunction;
  unbindField: TUnbindFieldFunction;
  onFieldValueChange: TOnFieldValueChangeFunction;
  setFieldRules(uniqueId: string, rules: IRule[]): void;
}

interface IFieldProps {
  name: string;
  value?: TValue;
  defaultValue?: TValue;
  rules?: IRule[];
}

export type TFieldComponent = React.ComponentType<IFieldProps>;

interface IState {
  value: TValue;
  error: string;
}

const createField = (options: IFieldOptions):TFieldComponent => {
  let fieldIndex = 0;

  return class extends React.Component<IFieldProps, IState> {
    private uniqueId!:string;

    private name = '';

    constructor(props:IFieldProps) {
      super(props);

      fieldIndex += 1;
      this.uniqueId = `key_${fieldIndex}`;

      this.init(true);
    }

    componentDidUpdate(prevProps:IFieldProps) {
      const { name, value, rules } = this.props;
      // name变化，该Field重新绑定
      if (name !== prevProps.name) {
        this.init();
      } else {
        // 更新校验规则，同步操作，先执行
        options.setFieldRules(this.uniqueId, rules || []);

        // 通过外部修改value，异步操作，后执行，避免新的rules未生效
        if (value !== prevProps.value) {
          options.onFieldValueChange(this.uniqueId, this.name, value ?? '').then(({ error }) => {
            if (error !== this.state.error) {
              this.setState({
                error,
              });
            }
          });
        }
      }
    }

    componentWillUnmount() {
      options.unbindField(this.uniqueId);
    }

    /**
     * 初始化绑定控件，用于组件mount时机和reset时机
     * @param {Boolean} didMount 是否是初始化加载
     */
    public init = (didMount?:boolean) => {
      const { name, value, defaultValue, rules } = this.props;
      const initValue = (value === undefined ? defaultValue : value) ?? '';
      if (didMount) {
        this.state = {
          value: initValue,
          error: '',
        };
      } else {
        this.setState({
          value: initValue,
          error: '',
        });
      }
      this.name = name;
      // 表单组件绑定
      options.bindField(this.uniqueId, name, initValue, rules, this);
    };

    /**
     * 非受控表单项value change事件，用户分布式内部自更新
     * @param {Value} value
     * @returns {value: TValue, error: string} 当前表单项的value值和error值
     */
    public onChange = (value: TValue):Promise<{value:TValue, error: string}> => {
      // 受控组件模式 或者 value没有变更
      if (this.props.value !== undefined || value === this.state.value) {
        return Promise.resolve({
          value: this.state.value,
          error: this.state.error,
        });
      }

      // 执行重绘
      this.setState({ value });

      // 非受控组件模式 且 value有变更
      return new Promise((resolve) => {
        options.onFieldValueChange(this.uniqueId, this.name, value).then(({ error }) => {
          if (error !== this.state.error) {
            this.setState({
              error,
            }, () => {
              resolve({ value, error });
            });
          } else {
            resolve({ value, error });
          }
        });
      });
    };

    /**
     * 修改error信息
     * @param {String} error 错误信息
     */
    public updateError = (error:string) => {
      if (error !== this.state.error) {
        this.setState({
          error,
        });
      }
    };

    /**
     * 重置表单项状态，重置value、error
     */
    public reset = () => {
      this.init();
    };

    render() {
      const { children, value } = this.props;
      if (typeof children === 'function') {
        const props = {
          value: value === undefined ? this.state.value : value,
          error: this.state.error,
          onChange: this.onChange,
        };
        return children(props);
      } else if (children) {
        return children;
      }

      return null;
    }
  };
};
export default createField;
