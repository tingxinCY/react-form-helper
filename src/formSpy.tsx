import React from 'react';
import { TBindFormSpyFunction, TUnbindFormSpyFunction } from './ReactFormHelper.js';
import { IFormSpyArguments, TErrors, TValue, TValues } from './types.js';

interface IFormSpyCreateOptions {
  bindFormSpy: TBindFormSpyFunction;
  unbindFormSpy: TUnbindFormSpyFunction;
}

interface IFormSpyProps {
  initialValues?: TValues;
  subscription?: Record<string, boolean>;
  children?: React.ReactNode | ((args: IFormSpyArguments) => React.ReactNode);
}

interface IFormSpyState {
  values: TValues;
  errors: TErrors;
}

export type TFormSpyComponent = React.ComponentType<IFormSpyProps>;

const createFormSpy = (options: IFormSpyCreateOptions): TFormSpyComponent => {
  let formSpyIndex = 0;

  return class extends React.Component<IFormSpyProps, IFormSpyState> {
    private _uniqueId!: string;

    constructor(props: IFormSpyProps) {
      super(props);

      formSpyIndex += 1;
      this._uniqueId = `key_${formSpyIndex}`;

      this.state = {
        values: props.initialValues || {},
        errors: {},
      };

      this.init();
    }

    componentWillUnmount() {
      options.unbindFormSpy(this._uniqueId);
    }

    /**
     * 初始化函数
     */
    init = () => {
      options.bindFormSpy(this._uniqueId, this);
    };

    /**
     * 订阅表单项值和错误信息变更的回调函数
     *
     * @param name 表单项名
     * @param value 表单项值
     * @param errorMessage 表单项错误信息
     */
    public onFieldChange = (name: string, value: TValue, errorMessage: string) => {
      // 校验是否订阅该表单项
      if (this._isSubscribe(name)) {
        // 校验value是否更新
        if (this.state.values[name] !== value) {
          this.setState(({ values }) => ({
            values: {
              ...values,
              [name]: value,
            },
          }));
        }
        // 校验error是否更新
        if (this.state.errors?.[name] !== errorMessage) {
          this.setState(({ errors }) => ({
            errors: {
              ...errors,
              [name]: errorMessage,
            },
          }));
        }
      }
    };

    /**
     * 表单项重置，订阅该表单项的spy也要相应的重置
     * @param name 表单项名称
     */
    public onFieldReset = (name: string) => {
      const { initialValues = {} } = this.props;
      this.onFieldChange(name, initialValues[name], '');
    };

    render() {
      const { children } = this.props;
      if (typeof children === 'function') {
        const formSpyProps: IFormSpyArguments = {
          values: this.state.values,
          errors: this.state.errors,
          initialValues: { ...this.props.initialValues },
        };
        return children(formSpyProps);
      } else if (children) {
        return children;
      }
      return null;
    }

    /**
     * 是否订阅该表单项
     * @param name 表单项名称
     */
    private _isSubscribe = (name: string) => {
      return !!this.props.subscription?.[name];
    };
  };
};

export default createFormSpy;
