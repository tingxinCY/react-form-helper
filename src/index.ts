import createField, { IRule, TValue, TFieldComponent } from './field';
import Schema, { Rules, ValidateError } from 'async-validator';
import createFormSpy, { TFormSpyComponent } from './formSpy';

// async-validator的types中不包含warning，直接设置会报错
const SchemaTemp:any = Schema;
SchemaTemp.warning = function () {};

// 工厂函数参数对象
export interface IReactFormHelperOptions {
  onValueChange?(name: string, value: any, error: string): void;
  onErrorsChange?(errors: {[fieldName:string]: string}|null): void;
}

// 表单项对象
interface IFieldObject {
  name: string;
  value: TValue;
  rules: IRule[];
  error: string;
  fieldComponent: any;
}

// 表单项对象集合
export type TFieldsCollection = Record<string, IFieldObject>;

// 表单项错误信息集合
type TErrorsCollection = {[fieldName:string]: string}|null;

// 表单校验结果对象
type TResultDataObject = {
  errors: TErrorsCollection;
  values: any;
};

// 表单项绑定函数
export type TBindFieldFunction = (
  uniqueId: string,
  name: string,
  value: TValue,
  rules: IRule[]|undefined,
  fieldComponent: any,
) => void;

// 表单项解绑函数
export type TUnbindFieldFunction = (uniqueId: string) => void;

// 表单项value更新函数
export type TOnFieldValueChangeFunction = (
  uniqueId: string,
  name: string,
  value: TValue
) => Promise<{error:string}>;

// formSpy数据对象
type TFormSpyObject = {
  formSpyComponent: any;
};

// 表单项对象集合
type TFormSpysCollection = Record<string, TFormSpyObject>;

// 绑定formSpy
export type TBindFormSpyFunction = (
  uniqueId:string,
  formSpyComponent:any
) => void;

// 解绑formSpy
export type TUnbindFormSpyFunction = (uniqueId:string) => void;

class ReactFormHelper {
  public Field: TFieldComponent;

  public FormSpy: TFormSpyComponent;

  // 表单项对象集合
  private _fields:TFieldsCollection = {};

  // 错误信息缓存，用来与当前错误信息做对比，判断是否触发hook
  private _errorsCache:TErrorsCollection = {};

  // ReactFormHelper实例参数
  private _options:IReactFormHelperOptions = {};

  // formSpy对象集合
  private _formSpys:TFormSpysCollection = {};

  constructor(options?:IReactFormHelperOptions) {
    options && (this._options = options);

    this.Field = createField({
      bindField: this._bindField,
      unbindField: this._unbindField,
      onFieldValueChange: this._onFieldValueChange,
      setFieldRules: this._setFieldRules,
    });

    this.FormSpy = createFormSpy({
      bindFormSpy: this._bindFormSpy,
      unbindFormSpy: this._unbindFormSpy,
    });
  }

  /**
   * 定向修改某个表单项的值（主要用于表单联动修改场景）
   *
   * @param name 表单项名称
   * @param value 表单项值
   */
  public setFieldValue(name: string, value: TValue) {
    for (const uniqueId in this._fields) {
      if (this._fields[uniqueId].name === name) {
        this._fields[uniqueId].fieldComponent.onChange(value);
        break;
      }
    }
  }

  /**
   * 验证全部表单项
   * @param callback 表单验证的回调函数
   */
  public async validateFields():Promise<TResultDataObject> {
    const promiseArray:Array<Promise<any>> = [];
    Object.keys(this._fields).forEach(uniqueId => {
      /* 对表单项逐一进行校验，避免因为一个async validation而导致整体校验结果进入promise中，
      在promise中进行批量的field setState error会导致同步执行，触发性能问题，而逐一校验可保证同步规则同步校验，
      批量的同步校验导致的批量的field setState error可以批量异步执行，保证性能，个别的async校验导致setState的同步执行，将性能损耗降到最低 */
      const field = this._fields[uniqueId];
      // 未定义rule的field无需进行校验
      if (field.rules.length > 0) {
        const rules = { [uniqueId]: field.rules };
        const source = { [uniqueId]: field.value ?? '' };
        promiseArray.push(this._doValidate(rules, source));
      }
    });
    // 等待所有表单项校验完成之后，计算values、errors
    await Promise.all(promiseArray);

    const data = this._processData();

    // 批量校验结束时触发全局hook
    this._emitErrorsChange(data.errors);

    return data;
  }

  /**
   * 获取解析之后的value（按照namePath进行解析）
   *
   * @memberof ReactFormHelper
   */
  public getParsedValues():any {
    const { values } = this._processData();
    return values;
  }

  /**
   * 实时获取当前状态下的所有表单项值
   */
  public getValues():{[key:string]:TValue} {
    const { fieldValues } = this._getFormState();
    return fieldValues;
  }

  /**
   * 实时获取当前状态下的所有错误信息
   * 备注：并不触发表单整体的错误校验，执行表单整体校验请使用validateFields方法
   */
  public getErrors():TErrorsCollection {
    const { fieldErrors } = this._getFormState();
    return Object.keys(fieldErrors).length ? fieldErrors : null;
  }

  /**
   * 重置表单控件，还原至初始value、error状态，支持指定表单name，否则对整体表单执行
   *
   * @memberof ReactFormHelper
   */
  public reset(name?:string) {
    let uniqueIds:string[] = [];
    if (name) {
      const uniqueId = this._getUniqueIdByName(name);
      if (uniqueId) {
        uniqueIds.push(uniqueId);
      }
    } else {
      uniqueIds = Object.keys(this._fields);
    }

    uniqueIds.forEach((fieldUniqueId) => {
      this._fields[fieldUniqueId].fieldComponent.reset();

      // 触发FormSpy重绘
      Object.keys(this._formSpys).forEach(spyUniqueId => {
        const fieldName = this._fields[fieldUniqueId].name;
        this._formSpys[spyUniqueId].formSpyComponent.onFieldReset(fieldName);
      });
    });
  }

  /**
   * 获取表单的扁平化value和存在的errors
   *
   * @private
   * @returns [fieldValues, fieldErrors] 扁平化的values和errors
   * @memberof ReactFormHelper
   */
  private _getFormState():{
    fieldValues: {[key:string]:TValue},
    fieldErrors: {[key:string]:string}
  } {
    const fieldValues:{[key:string]:TValue} = {};
    const fieldErrors:{[key:string]:string} = {};
    Object.keys(this._fields).forEach(uniqueId => {
      const obj = this._fields[uniqueId];
      fieldValues[obj.name] = obj.value;
      if (obj.error) {
        fieldErrors[obj.name] = obj.error;
      }
    });
    return { fieldValues, fieldErrors };
  }

  /**
   * 通过表单项名称查询对应uniqueId
   *
   * @private
   * @param {string} name
   * @returns {string}
   * @memberof ReactFormHelper
   */
  private _getUniqueIdByName(name:string):string {
    if (name) {
      for (const uniqueId of Object.keys(this._fields)) {
        if (this._fields[uniqueId].name === name) {
          return uniqueId;
        }
      }
    }
    return '';
  }

  /**
   * 表单项value change的回调函数，执行表单校验，调用用户传入的全局回调
   *
   * @private
   * @type {TOnFieldValueChange}
   * @memberof ReactFormHelper
   */
  private _onFieldValueChange:TOnFieldValueChangeFunction = async (
    uniqueId: string,
    name: string,
    value: TValue,
  ) => {
    const validationResult = await this._validateSingleField(uniqueId, value);

    // 触发FormSpy重绘
    Object.keys(this._formSpys).forEach(uid => {
      this._formSpys[uid].formSpyComponent.onFieldChange(name, value, validationResult.error);
    });

    // 表单全局value change hook
    this._options.onValueChange && this._options.onValueChange(name, value, validationResult.error);

    // 当设置了onErrorsChange Hook，同时当前表单项error发生了变化，则触发全局errorsChange hook
    const cacheError = this._errorsCache ? (this._errorsCache[name] || '') : '';
    if (this._options.onErrorsChange && validationResult.error !== cacheError) {
      const newErrors = this.getErrors();
      this._emitErrorsChange(newErrors);
    }

    return validationResult;
  };

  /**
   * 绑定表单字段
   * @param uniqueId 唯一ID
   * @param name 字段名称
   * @param value 字段值,非undefined，所有表单控件必须为受控组件
   * @param rules 字段验证规则，array
   * @param onChange 表单项value修改函数
   */
  private _bindField:TBindFieldFunction = (
    uniqueId: string,
    name: string,
    value: TValue,
    rules: IRule[] = [],
    fieldComponent,
  ) => {
    if (!name) return;
    const field:IFieldObject = {
      name,
      value,
      rules,
      error: '',
      fieldComponent,
    };
    this._fields[uniqueId] = field;
  };

  /**
   * 解绑表单字段
   * @param uniqueId 唯一ID,uniqueId
   */
  private _unbindField:TUnbindFieldFunction = (uniqueId:string) => {
    if (this._fields[uniqueId]) {
      delete this._fields[uniqueId];
    }
  };

  /**
   * 更新表单控件校验规则
   *
   * @private
   * @memberof ReactFormHelper
   */
  private _setFieldRules = (uniqueId:string, rules: IRule[]) => {
    if (this._fields[uniqueId]) {
      this._fields[uniqueId].rules = rules;
    }
  };

  /**
   * 校验指定表单字段
   * @param uniqueId 唯一Id
   * @param value 字段值
   */
  private async _validateSingleField(uniqueId: string, value: TValue): Promise<{error: string}> {
    if (!this._fields[uniqueId]) return Promise.reject();
    this._fields[uniqueId].value = value;
    const descriptor = {
      [uniqueId]: this._fields[uniqueId].rules,
    };
    const source = {
      [uniqueId]: value === null ? '' : value,
    };

    await this._doValidate(descriptor, source);

    return { error: this._fields[uniqueId].error };
  }

  /**
   * 处理context中的数据，产出errors、values
   * @param {Object} fields 源数据表单字段
   */
  private _processData():TResultDataObject {
    const errors:TErrorsCollection = {};
    const values:any = {};
    Object.keys(this._fields).forEach(uniqueId => {
      // debugger;
      const field = this._fields[uniqueId];
      if (field.error) {
        errors[field.name] = field.error;
      }

      // 根据path，初始化value对象的结构。(后一个level决定前一个level的类型)
      const namePath = field.name.split('.');
      let tempValues = values;
      for (let i = 1; i < namePath.length; i++) {
        // 如果有下一级path，当前级必须为object、array，如果不是，则可能是用户设定的namepath有冲突，后面path规则覆盖前面
        if (tempValues[namePath[i - 1]] === undefined || typeof tempValues[namePath[i - 1]] !== 'object') {
          const isNum = !Number.isNaN(Number(namePath[i]));
          tempValues[namePath[i - 1]] = isNum ? [] : {};
        }
        tempValues = tempValues[namePath[i - 1]];
      }
      tempValues[`${namePath.pop()}`] = field.value;
    });

    return {
      errors: Object.keys(errors).length ? errors : null,
      values,
    };
  }

  /**
   * 进行表单验证
   * @param descriptor 校验规则
   * @param source 源数据
   * @param cb 回调函数
   */
  private _doValidate(
    descriptor:{[key:string]:IRule[]},
    source:{[key:string]: TValue},
  ):Promise<null> {
    return new Promise((resolve) => {
      Object.keys(descriptor).forEach((uniqueId) => {
        // 先清空当前字段的error，若后续校验未报error，则相当于清除错误
        this._fields[uniqueId].error = '';
      });

      // 执行校验
      const validator = new Schema(descriptor as Rules);
      validator.validate(source, undefined, (errors:ValidateError[]) => {
        if (errors) {
          errors.forEach((errorItem) => {
            if (!this._fields[errorItem.field].error) {
              this._fields[errorItem.field].error = errorItem.message || 'This is the default error message';
              this._fields[errorItem.field].fieldComponent.updateError(this._fields[errorItem.field].error);
            }
          });
        }
        resolve();
      });
    });
  }

  /**
   * 触发表单错误信息更新处理逻辑
   *
   * @private
   * @memberof ReactFormHelper
   */
  private _emitErrorsChange(newErrors: TErrorsCollection) {
    // 若设置了全局钩子，则在errors变更之后触发hook
    if (this._options.onErrorsChange) {
      // diff对比
      let diff = false;
      if (this._errorsCache !== null && newErrors !== null) {
        if (Object.keys(this._errorsCache).length !== Object.keys(newErrors).length) {
          diff = true;
        } else {
          for (const fieldName in this._errorsCache) {
            if (newErrors[fieldName] !== this._errorsCache[fieldName]) {
              diff = true;
              break;
            }
          }
        }
      } else if (!(this._errorsCache === null && newErrors === null)) {
        diff = true;
      }

      if (diff) {
        this._options.onErrorsChange(newErrors);
      }
    }

    // 更新私有error对象
    this._errorsCache = newErrors;
  }

  /**
   * 绑定formSpy控件
   *
   * @private
   * @type {TBindFormSpyFunction}
   * @memberof ReactFormHelper
   */
  private _bindFormSpy:TBindFormSpyFunction = (
    uniqueId, formSpyComponent,
  ) => {
    const formSpy:TFormSpyObject = {
      formSpyComponent,
    };
    this._formSpys[uniqueId] = formSpy;
  };

  /**
   * 解绑formSpy
   *
   * @private
   * @type {TUnbindFormSpyFunction}
   * @memberof ReactFormHelper
   */
  private _unbindFormSpy:TUnbindFormSpyFunction = (uniqueId) => {
    if (this._formSpys[uniqueId]) {
      delete this._formSpys[uniqueId];
    }
  };
}

export default ReactFormHelper;
