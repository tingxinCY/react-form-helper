declare module 'react-form-validation-hoc' {
  import { ComponentType, NamedExoticComponent } from 'react';

  import hoistNonReactStatics = require('hoist-non-react-statics');

  // Applies LibraryManagedAttributes (proper handling of defaultProps
  // and propTypes), as well as defines WrappedComponent.
  export type CreatedComponent<C extends ComponentType<any>, P> =
    NamedExoticComponent<JSX.LibraryManagedAttributes<C, P>>
    & hoistNonReactStatics.NonReactStatics<C>
    & { WrappedComponent: C; };

  // Infers prop type from component C
  type GetProps<C> = C extends ComponentType<infer P> ? P : never;

  // Omit taken from https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-8.html
  type Omit<T, K extends keyof T> = Pick<T, Exclude<keyof T, K>>;

  type TInnerProps = {
    validator:IValidator
  };

  type InferableComponentEnhancerWithProps =
    <C extends ComponentType<GetProps<C>>>(component: C)
      => CreatedComponent<C, Omit<GetProps<C>, keyof TInnerProps>>;

  interface ICreate {
    (): InferableComponentEnhancerWithProps;
  }

  const create: ICreate;
  export default create;

  export interface IValidator {
    FieldDecorator: React.FC<{
      name: string,
      value: any,
      rules?: any,
    }>;
    errors: {[key:string]:string};
    validateFields: (cb: (errors: {[key:string]:string}|null, values: {[key:string]:any}) => void) => void;
    reset: () => void;
    getValues: () => any;
  }
}