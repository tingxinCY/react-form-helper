# @tingxin_cy/react-form-helper

React 表单解决方案，专注解决“数据采集”和“数据校验”两大表单核心需求，采用分布式设计从根源解决表格性能问题，同时该方案与 UI 组件解耦适用于任何 UI 框架或者原生 UI，支持任何复杂的表单需求。

## 特性

- 支持自动化表单校验，内置多种数据类型规则，同时支持自定义的同步校验&异步校验。
- 支持结构化数据收集，支持按照 namePath (例如：'a.b.0.c'）自动解析并输出结构化表单数据。
- 表单字段控件支持采用分布式渲染，从而优化表单性能，达到类似非受控组件的效果。
- 无 UI 侵入，适用于任何 UI 框架或者原生 UI，一次学习到处使用。
- 支持多表单实例并存，可并列使用也可嵌套使用。
- 极简 API 设计，仅对外输出 2 个的组件和 5 个方法。
- 支持 React Hook 模式
- 总之：适用于任何复杂程度的动态表单场景。

## 安装

```js
npm install @tingxin_cy/react-form-helper -S
```

or

```js
yarn add @tingxin_cy/react-form-helper -S
```

## 导入（class）

```js
import ReactFormHelper from '@tingxin_cy/react-form-helper';
```

### Class：ReactFormHelper

```js
const formInstance = new ReactFormHelper({
  onValueChange: (name, value, error) => {},
  onErrorsChange: (errors) => {
    this.setState({
      formErrors: errors,
    });
  },
});
```

## 导入（hook)

```js
import { useForm } from '@tingxin_cy/react-form-helper';
```

### Hook: useForm

```js
const formInstance = useForm({
  onValueChange: (name, value, error) => {},
  onErrorsChange: (errors) => {
    this.setState({
      formErrors: errors,
    });
  },
});
```

### 核心组件

```js
const { Field, FormSpy } = formInstance; // 核心组件
```

#### options (非必须)

| 参数           | 说明                                                                                          | 类型                                                                |
| -------------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| onValueChange  | 全局钩子，监听 value change 事件，适用于一些全局通用的业务逻辑，例如日志发送等                | (name:string, value: string\|number\|boolean, error:string) => void |
| onErrorsChange | 全局钩子，监听 error change 事件，用于解决一些特殊的交互需求，一般情况建议采用\<FormSpy\>替代 | (errors: {[key:string]:string} \| null)=>void                       |

---

## Component

### \<Field \/\>

核心组件，用于增强表单控件，用于实现表单校验、数据收集等核心功能。

```js
const { Field } = formInstance;
```

##### 属性

| 名称         | 说明                                                                                                                                                          | 类型                      | 空   |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---- |
| name         | 表单项 Name，表单全局唯一，用于数据收集，支持 namePath 格式，自动收集格式化数据。                                                                             | string                    | 非空 |
| defaultValue | 表单项默认值，value===undefined 时生效，将实现非受控组件的效果，此时可以通过<Field\/>内部注入的 onChange 方法修改表单项值，此时将采用分布式渲染，性能有优势。 | string\| number\| boolean | 可空 |
| value        | 表单项 Value，可通过修改该值实现表单数据的变更，将实现受控组件的效果，此时无法采用<Field \/>内部注入的 onChange 方法修改表单项值。                            | string\| number\| boolean | 可空 |
| rules        | 检验规则，为空时将不对该表单值进行校验，可利用此特性实现单纯的数据收集。                                                                                      | [Rule](#rule)[]           | 可空 |

##### 分布式渲染（等同于非受控组件形态）:

```js
<Field
  name='userName'
  defaultValue=''
  rule={[{ type: 'string', required: true, message: '用户名不能为空' }]}
>
  {/* 推荐：采用内部注入的参数进行表单项赋值、更新，
      将实现非受控组件的效果，已达到分布式渲染的目的，保证性能 */}
  {({ value, onChange, error }) => (
    <div>
      <Input value={value} onChange={(e) => onChange(e.target.value)} />
      <span>{error}</span>
    </div>
  )}
</Field>
```

参数注入：
| 名称 | 说明 | 类型 |
| ---- | ---- | ---- |
| value | 表单项 Value，用于表单控件赋值。 | string\|number\|boolean |
| onChange | 通过该方法进行 value 更新，自动触发表单校验。 | (value:number\|string\|boolean) => Promise<{value: string\|number\|boolean, error:string}> |
| error | 错误信息，可用于错误信息展示 | string |

---

##### 非分布式渲染（等同于受控组件形态）：

```js
<Field
  name='userName'
  value={this.state.userName}
  rule={[{ type: 'string', required: true, message: '用户名不能为空' }]}
>
  {/* 不推荐: 不通过注入的onChange方法更新value，
      而是触发外部的setState更新，这将导致页面重绘，容易引发性能问题。 */}
  {({ value, error }) => (
    <div>
      <Input value={value} onChange={(e) => this.setState('userName', e.target.value)} />
      <span>{error}</span>
    </div>
  )}
</Field>
```

#### Rule

表单校验规则，更多信息可查看[async-validator](https://github.com/yiminghe/async-validator)。
| 名称 | 说明 | 类型 |
| ---- | ---- | ---- |
| type？ | 数据校验类型 | 'string'\|'number'\|'integer'\| 'float'\|'boolean'\|'url'\| 'email'\|'enum'，默认值：'string' |
| required? | 是否是必填项。 | boolean |
| message? | 错误提示信息。 | string |
| pattern? | 正则表达式。 | boolean |
| min？ | 当 type 为 number 时，该值限定最小值；当 type 为 string 时，该值限定最小长度； | number |
| max? | 当 type 为 number 时，该值限定最大值；当 type 为 string 时，该值限定最大长度； | number |
| length? | 当 type 为 number 时，限定值大小；当 type 为 string 时，限定字符串长度；若 length 和 min、max 并存时，length 优先 | number |
| enum? | 校验 value 是否符合指定的枚举值 | (number\|string\|boolean)[ ] |
| whitespace? | true 时，仅包含空格的字符串将被视为空字符串，将触发 required 错误 | boolean |
| validator? | 自定义校验函数，支持同步校验和异步校验 | function (rules, value, callback:(error?: string)=>{}) {} |

---

### \<FormSpy \/\>

订阅表单项 change，触发局部 render，采用分布式渲染的方式解决联动表单场景下的性能问题。

```js
const { FormSpy } = formInstance;
```

##### 属性

| 名称          | 说明                                                                                                                                          | 类型                                     | 必须   |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------ |
| initialValues | 当前 FormSpy 表单项初始值，可以按需提供，无需提供全量表单字段                                                                                 | {[name:string]: string\|number\|boolean} | 非必须 |
| subscription  | 订阅的表单项，当任一订阅的表单项 value change 时，可触发当前\<FormSpy \/\>重新渲染，并获取到最新表单项 value 和 error，未设置时监控所有表单项 | {[name:string]:boolean}                  | 非必须 |

#### Demo

省市联动场景，当省份切换时，要联动更新城市数据

```js
<>
  <Field name='province' defaultValue='beijing'>
    {({ value, onChange }) => <ProvinceSelect value={value} onChange={onChange} />}
  </Field>

  <FormSpy
    initialValues={{
      province: 'beijing',
    }}
    subscription={{
      province: true,
    }}
  >
    {({ values, errors }) => (
      <Field name='city' defaultValue=''>
        {({ value, onChange }) => (
          <CitySelect province={values.province} value={value} onChange={onChange} />
        )}
      </Field>
    )}
  </FormSpy>
</>
```

参数注入：
| 名称 | 说明 | 类型 |
| ---- | ---- | ---- |
| values | subscription 所订阅的相关表单项值，动态更新，默认值为 initialValues | {[key:string]: string\|number\|boolean} |
| errors | subscription 设置的所有表单项错误信息 | {[key:string]:string} |
| initialValues | initialValues 属性值，用于透传给 FormSpy 内部的子组件 | {[key:string]:string} |

---

## 方法

#### - validateFields():Promise<{errors: {[name:string]:string}|null, values: any}>

校验所有表单项，返回当前表单收集到的数据和错误信息，多用于表单提交场景

```js
onSubmit() {
  this.formInstance.validateFields().then(({errors, values}:any) => {
    if (!errors) {
      // do submit action
    } else {
      // do something for error
    }
  })
}
```

#### - setFieldValue(name: string, value: string|number|boolean):void

修改特定表单项值，主要用于表单联动编辑场景
注意：该方法仅在表单项为非受控组件模式下生效。（value === undefined && defaultValue !== undefined）

```js
<Field
  name='userinfo.workid'
  value={this.state.workid}
  rules={[{ required: true, message: 'Required' }]}
>
  {(props: any) => (
    <Input
      value={props.value}
      onChange={(e) => {
        props.onChange(e.target.value);
        this.formInstance.setFieldValue('userinfo.name', `员工-${e.target.value}`);
      }}
    />
  )}
</Field>
```

#### - getValues(needParse:boolean):Object

实时获取当前状态下的表单值，支持获取扁平化数据和结构化数据

##### 参数

| 名称      | 说明                                   | 类型    | 默认  |
| --------- | -------------------------------------- | ------- | ----- |
| needParse | 是否需要基于 namePath 进行表单数据解析 | boolean | false |

##### demo

```js
onButtonClick = () => {
  const values = this.formInstance.getValues();
  console.log(values);
  /* needParse = false时，获取扁平化数据
  {
    "userinfo.name": "张三",
    "userinfo.gender": "male",
    "age": 20,
    "like.0": "足球",
    "like.1": "篮球",
    "like.2": "排球",
  }
  */
  const parsedValues = this.formInstance.getValues(true);
  console.log(parsedValues);
  /* needParse = true时，获取结构化数据
  {
    userinfo: {
      name: "张三”,
      gender: "male"
    },
    age: 20,
    like: [ "足球", "篮球", "排球"]
  }
  */
};
```

### - getErrors():{[name:string]: string};

实时获取当前状态的错误信息
注意：由于校验表单项并绘制表单项 error 信息较为消耗性能，尤其某些表单采用异步校验时，校验时间略长，所以该方法只返回已经产生的错误（编辑表单项内容时触发校验产生的 error），并不会对整体表单进行校验，如需获取表单整体的错误信息请使用`validateFields`方法

```js
onButtonClick = () => {
  const errors = this.formInstance.getErrors();
  console.log(errors);
};
```

### - reset(fieldName?:string):void;

表单重置功能，清除 error 信息，复位至 defaultValue 值，若未设置 fieldName，则复位所有表单项

```js
onButtonClick = () => {
  // 重置指定表单项
  this.formInstance.reset('fieldName');
  // 重置所有表单项
  this.formInstance.reset();
};
```

---

## Demo

```js
import React from 'react';
import ReactFormHelper from '@tingxin_cy/react-form-helper';
import { Input, Radio, Button } from 'antd';

class FormDemo extends React.Component {
  constructor(props) {
    super(props);
    this.formInstance = new ReactFormHelper({
      // 表单全局hook
      onValueChange(name, value, error) {
        console.log(name, value, error);
      },
    });
  }

  onSubmit = () => {
    this.formInstance.validateFields().then(({ errors, values }) => {
      console.log(errors);
      console.log(values);

      /* 错误的情况
      {
        userinfo.name: "请填写名称",
        userinfo.gender: "请选择性别",
        syncValue: "内容错误，请检查。",
        asyncValue: "内容错误，请检查。",
        like.0: "请填写第一个爱好",
        like.1: "请填写第二个爱好",
        like.2: "请填写第三个爱好"
      }
      {
        userinfo: {
          name: "",
          gender: ""
        },
        syncValue: "",
        asyncValue: "",
        like: [ "", "", ""]
      }
      */

      /* 正确的情况
      null
      {
        userinfo: {
          name: "张三”,
          gender: "male"
        },
        syncValue: "sync",
        asyncValue: "async",
        like: [ "足球", "篮球", "排球"]
      }
      */
    });
  };

  render() {
    const { Field } = this.formInstance;
    return (
      <div>
        <Field
          name='userinfo.name'
          defaultValue=''
          rules={[{ type: 'string', required: true, message: '请填写名称' }]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        <Field
          name='userinfo.gender'
          defaultValue=''
          rules={[
            { type: 'enum', enum: ['male', 'female'], required: true, message: '请选择性别' },
          ]}
        >
          {(fieldProps) => (
            <div>
              <Radio.Group
                onChange={(e) => fieldProps.onChange(e.target.value)}
                value={fieldProps.value}
              >
                <Radio value={'male'}>男</Radio>
                <Radio value={'female'}>女</Radio>
              </Radio.Group>
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        {/* 自定义同步校验 */}
        <Field
          name='syncValue'
          defaultValue=''
          rules={[
            {
              validator(rule, value, callback) {
                if (value === 'sync') {
                  callback(); // 校验通过
                } else {
                  callback('内容错误，请检查。');
                }
              },
            },
          ]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        {/* 自定义异步校验 */}
        <Field
          name='asyncValue'
          defaultValue=''
          rules={[
            {
              validator(rule, value, callback) {
                Promise.resolve().then(() => {
                  if (value === 'async') {
                    callback(); // 校验通过
                  } else {
                    callback('内容错误，请检查。');
                  }
                });
              },
            },
          ]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        <Field
          name='like.0'
          defaultValue=''
          rules={[{ type: 'string', required: true, message: '请填写第一个爱好' }]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        <Field
          name='like.1'
          defaultValue=''
          rules={[{ type: 'string', required: true, message: '请填写第二个爱好' }]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        <Field
          name='like.2'
          defaultValue=''
          rules={[{ type: 'string', required: true, message: '请填写第三个爱好' }]}
        >
          {(fieldProps) => (
            <div>
              <Input
                value={fieldProps.value}
                onChange={(e) => fieldProps.onChange(e.target.value)}
              />
              <span>{fieldProps.error}</span>
            </div>
          )}
        </Field>

        <div>
          <Button onClick={this.onSubmit}>提交</Button>
        </div>
      </div>
    );
  }
}

export default FormDemo;
```
