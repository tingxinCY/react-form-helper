/**
 * 表单值类型
 */
export type TValue = any;

/**
 * 工厂函数参数对象
 */
export interface IReactFormHelperOptions {
  onValueChange?(name: string, value: any, error: string): void;
  onErrorsChange?(errors: { [fieldName: string]: string } | null): void;
  // 是否受控模式，默认true
  controlled?: boolean;
}

/**
 * Field组件的函数类型子节点的参数类型
 */
export interface IFieldArguments {
  name: string;
  value: any;
  error: string;
  onChange: (value: TValue) => Promise<{ value: TValue; error: string }>;
}

/**
 * 表单输出的参数对象
 */
export type TValues = Record<string, TValue>;

/**
 * 表单校验的错误对象
 */
export type TErrors = Record<string, string> | null;

/**
 * 表单校验结果对象
 */
export type TValidationResult<TFormData extends TValues = TValues> = {
  errors: TErrors;
  values: TFormData;
};

/**
 * FormSpy组件的函数类型子节点的参数类型
 */
export interface IFormSpyArguments {
  values: TValues;
  errors: TErrors;
  initialValues: TValues;
}
