import React from 'react';
import { TBindFormSpyFunction, TUnbindFormSpyFunction } from '.';
import { TValue } from './field';

interface IFormSpyCreateOptions {
  bindFormSpy: TBindFormSpyFunction;
  unbindFormSpy: TUnbindFormSpyFunction;
}

interface IFormSpyProps {
  initialValues?: {[name:string]:TValue};
  subscription?: {[name:string]:boolean};
}

interface IFormSpyState {
  values: {[name:string]:TValue};
  errors: {[name:string]:string};
}

export type TFormSpyComponent = React.ComponentType<IFormSpyProps>;

const createFormSpy = (options: IFormSpyCreateOptions):TFormSpyComponent => {
  let formSpyIndex = 0;

  return class extends React.Component<IFormSpyProps, IFormSpyState> {
    private _uniqueId!:string;

    constructor(props:IFormSpyProps) {
      super(props);

      formSpyIndex += 1;
      this._uniqueId = `key_${formSpyIndex}`;

      this.state = {
        values: props.initialValues || {},
        errors: {},
      };

      this.init();
    }

    init = () => {
      options.bindFormSpy(this._uniqueId, this);
    };

    componentWillUnmount() {
      options.unbindFormSpy(this._uniqueId);
    }

    /**
     * 订阅表单项值和错误信息变更的回调函数
     *
     * @param name 表单项名
     * @param value 表单项值
     * @param error 表单项错误信息
     */
    public onValueChange = (name:string, value:TValue, error:string) => {
      if (!this.props.subscription || this.props.subscription?.[name]) {
        this.setState(({ values, errors }) => ({
          values: { ...values, [name]: value },
          errors: { ...errors, [name]: error },
        }));
      }
    };

    render() {
      const { children } = this.props;
      if (typeof children === 'function') {
        const formSpyProps = {
          values: { ...this.state.values },
          errors: { ...this.state.errors },
        };
        return children(formSpyProps);
      } else if (children) {
        return children;
      }
      return null;
    }
  };
};

export default createFormSpy;
