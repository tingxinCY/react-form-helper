# @tingxin_cy/react-form-helper

React表单解决方案，专注解决“数据采集”和“数据校验”两大表单核心需求，支持受控表单模式和非受控表单模式(分布式设计可有效提升表单性能)，同时该方案不绑定UI逻辑，可与任何UI框架或者原生UI搭配使用，极致的灵活性设计支持任何复杂的表单需求。

## 特性

- 支持自动化表单校验，内置丰富完善的数据类型规则，同时支持自定义的同步校验&异步校验。
- 支持结构化数据收集，支持按照NamePath (例如：'a.b.0.c'）自动解析并输出结构化表单数据。
- 表单字段控件支持非受控的分布式渲染，从而优化表单性能，达到类似非受控组件的效果。
- 无内置 UI 组件，可与任何 UI 框架或者原生 UI搭配使用，一次学习到处使用。
- 支持多表单实例并存，每个表单实例之间相互独立，互不干扰。
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

## 导入（Class）

```js
import ReactFormHelper from '@tingxin_cy/react-form-helper';
```

### Class：ReactFormHelper

```js
type TFormData = {
  userInfo: {
    name: string;
    gender: string;
  };
  syncValue: string;
  asyncValue: string;
  like: string[];
}


const formInstance = new ReactFormHelper<TFormData>({
  onValueChange: (name, value, error) => {},
  onErrorsChange: (errors) => {
    this.setState({
      formErrors: errors,
    });
  },
  controlled: true
});
```

## 导入（Hook)

```js
import { useForm } from '@tingxin_cy/react-form-helper';
```

### Hook: useForm

```js
const formInstance = useForm<TFormData>({
  onValueChange: (name, value, error) => {},
  onErrorsChange: (errors) => {
    this.setState({
      formErrors: errors,
    });
  },
  controlled: true
});
```

### 核心组件

```js
const { Field, FormSpy } = formInstance; 
```

#### options (非必须)

| 参数 | 说明 | 类型 | 必填 |
| -------------- | ----------------------------------------------------- | ----------------------------------------------------------- | ---------- |
| onValueChange  | 全局钩子，监听 value change 事件，适用于一些全局通用的业务逻辑，例如日志发送等 | (name:string, value: string\|number\|boolean, error:string) => void | 否 |
| onErrorsChange | 全局钩子，监听 error change 事件，用于解决一些特殊的交互需求，一般情况建议采用\<FormSpy\>替代 | (errors: {[key:string]:string} \| null)=>void | 否 |
| controlled | 是否采用受控模式，默认值为 true，开启后将无法采用<Field \/>内部注入的 onChange 方法修改表单项值，须通过\<Field value={...} />修改表单项值。 | boolean | 否 |

---

## Component

### \<Field \/\>

核心组件，用于增强表单控件，用于实现表单校验、数据收集等核心功能。

```js
const { Field } = formInstance;
```

#### 属性

| 名称 | 说明 | 类型 | 必填 |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | ---------- |
| name         | 表单项 Name，表单全局唯一，用于数据收集，支持 namePath 格式，自动收集格式化数据。                                                                             | string                    | 是      |
| defaultValue | 表单项默认值，controlled 为 false 时生效，将实现非受控组件的效果，此时可以通过<Field\/>内部注入的 onChange 方法修改表单项值，此时将采用分布式渲染，性能有优势。 | string\| number\| boolean | 否       |
| value        | 表单项 Value，可通过修改该值实现表单数据的变更，将实现受控组件的效果，此时无法采用<Field \/>内部注入的 onChange 方法修改表单项值。                            | string\| number\| boolean | 否      |
| rules        | 检验规则，为空时将不对该表单值进行校验，可利用此特性实现单纯的数据收集。                                                                                      | [Rule](#rule)[]           | 否      |

---

#### 分布式渲染（等同于非受控组件形态）

```js
<Field
  name='userName'
  defaultValue=''
  rule={[{ type: 'string', required: true, message: '用户名不能为空' }]}
>
  {/* 采用内部注入的参数进行表单项赋值、更新，
      将实现非受控组件的效果，已达到分布式渲染的目的 */}
  {({ value, onChange, error }: IFieldArguments) => (
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

#### 受控渲染表单

受控模式下将具有更高的灵活性，表单绘制的原始数据和表单收集的数据解耦，结构可完全不同，在实现动态联动复杂表单同时也能轻易收集到想要的数据结构。
例如下面简单的例子中，原始数据中的userName字段将被收集到user.name字段中。

```js
<Field
  name='user.name'
  value={this.state.userName}
  rule={[{ type: 'string', required: true, message: '用户名不能为空' }]}
>
  {/* 不通过Field注入的onChange方法更新value，
      而是触发外部的value更新方法，将实现更好的受控效果。 */}
  {({ name, value, error }: IFieldArguments) => (
    <div>
      <Input value={value} onChange={(e) => this.setState(name, e.target.value)} />
      {error && (
        <span>{error}</span>
      )}
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

订阅表单项 change，触发局部 render，解决分布式渲染的方式下表单联动的需求。

```js
const { FormSpy } = formInstance;
```

#### 属性

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
    {({ values, errors }: IFormSpyArguments) => (
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

### - validateFields():Promise\<TValidationResult\<TFormData\>

校验所有表单项，返回当前表单收集到的数据和错误信息，多用于表单提交场景

```js
async onSubmit() {
  const { errors, values } = await this.formInstance.validateFields();
  if (!errors) {
    // do submit action
  } else {
    // do something for error
  }
}
```

### - setFieldValue(name: string, value: string|number|boolean):void

修改特定表单项值，主要用于表单联动编辑场景
注意：该方法仅在表单项为非受控组件模式下生效。（value === undefined && defaultValue !== undefined）

```js
<Field
  name='userInfo.workId'
  defaultValue={''}
  rules={[{ type:'string',required: true, message: 'Required' }]}
>
  {({value, onChange}: IFieldArguments) => (
    <Input
      value={value}
      onChange={(v) => {
        onChange(v);
        // 联动更新 name 表单项值
        this.formInstance.setFieldValue('userInfo.name', `员工-${v}`);
      }}
    />
  )}
</Field>

<Field
  name='userInfo.name'
  defaultValue={''}
  rules={[{ type:'string',required: true, message: 'Required' }]}
>
  {({value, onChange}: IFieldArguments) => (
    <Input
      value={value}
      onChange={onChange}
    />
  )}
</Field>
```

### - getValues(needParse:boolean):TValidationResult\<TFormData\>|Record\<string, TValue\>

实时获取当前状态下的表单值，支持获取扁平化数据和结构化数据

#### 参数

| 名称      | 说明                                   | 类型    | 默认  |
| --------- | -------------------------------------- | ------- | ----- |
| needParse | 是否需要基于 namePath 进行表单数据解析 | boolean | false |

#### demo

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

### - getErrors():TErrors

实时获取当前状态的错误信息
注意：由于校验表单项并绘制表单项 error 信息较为消耗性能，尤其某些表单采用异步校验时，校验时间略长，所以该方法只返回已经产生的错误（编辑表单项内容时触发校验产生的 error），并不会对整体表单进行校验，如需获取表单整体的错误信息请使用`validateFields`方法

```js
onButtonClick = () => {
  const errors = this.formInstance.getErrors();
  console.log(errors);
};
```

### - reset(fieldName?:string):void

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
import { useForm, IFieldArguments } from '@tingxin_cy/react-form-helper';
import { Button, Input, Radio } from 'antd';
import React, { useState } from 'react';

type TFormData = {
  userInfo: {
    name: string;
    gender: 'male' | 'female';
  };
  syncValue: string;
  asyncValue: string;
  likes: string[];
};

const FormDemo = () => {
  const [formData, setFormData] = useState<TFormData>({
    userInfo: {
      name: '',
      gender: 'male',
    },
    syncValue: '',
    asyncValue: '',
    likes: ['', '', ''],
  });
  const formInstance = useForm<TFormData>({
    // 表单全局hook
    onValueChange(name, value, error) {
      console.log(name, value, error);
    },
  });

  const onSubmit = async () => {
    const { errors, values } = await formInstance.validateFields();
    console.log(errors);
    console.log(values);

    /**
      ##错误的情况
      {
        userInfo.name: "请填写名称",
        userInfo.gender: "请选择性别",
        syncValue: "内容错误，请检查。",
        asyncValue: "内容错误，请检查。",
        likes.0: "请填写第一个爱好",
        likes.1: "请填写第二个爱好",
        likes.2: "请填写第三个爱好"
      }
      {
        userInfo: {
          name: "",
          gender: ""
        },
        syncValue: "",
        asyncValue: "",
        likes: [ "", "", ""]
      }
    */

    /**
      ##正确的情况
      null
      {
        userInfo: {
          name: "张三",
          gender: "male"
        },
        syncValue: "sync",
        asyncValue: "async",
        likes: [ "足球", "篮球", "排球"]
      }
    */
  };

  const { Field } = formInstance;
  return (
    <div>
      <Field
        name="userInfo.name"
        value={formData.userInfo.name}
        rules={[{ type: 'string', required: true, message: '请填写名称' }]}
      >
        {({ name, value, error }: IFieldArguments) => (
          <div>
            <Input
              value={value}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  userInfo: {
                    ...formData.userInfo,
                    [name]: e.target.value,
                  },
                });
              }}
            />
            <span>{error}</span>
          </div>
        )}
      </Field>

      <Field
        name="userInfo.gender"
        value={formData.userInfo.gender}
        rules={[
          {
            type: 'enum',
            enum: ['male', 'female'],
            required: true,
            message: '请选择性别',
          },
        ]}
      >
        {({ name, value, error }: IFieldArguments) => (
          <div>
            <Radio.Group
              onChange={(e) => {
                setFormData({
                  ...formData,
                  userInfo: {
                    ...formData.userInfo,
                    [name]: e.target.value,
                  },
                });
              }}
              value={value}
            >
              <Radio value={'male'}>男</Radio>
              <Radio value={'female'}>女</Radio>
            </Radio.Group>
            <span>{error}</span>
          </div>
        )}
      </Field>

      {/* 自定义同步校验 */}
      <Field
        name="syncValue"
        value={formData.syncValue}
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
        {({ name, value, error }: IFieldArguments) => (
          <div>
            <Input
              value={value}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  [name]: e.target.value,
                });
              }}
            />
            <span>{error}</span>
          </div>
        )}
      </Field>

      {/* 自定义异步校验 */}
      <Field
        name="asyncValue"
        value={formData.asyncValue}
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
        {({ name, value, error }: IFieldArguments) => (
          <div>
            <Input
              value={value}
              onChange={(e) => {
                setFormData({
                  ...formData,
                  [name]: e.target.value,
                });
              }}
            />
            <span>{error}</span>
          </div>
        )}
      </Field>

      {formData.likes.map((item, index) => (
        <Field
          key={index}
          name={`likes.${index}`}
          value={item}
          rules={[{ type: 'string', required: true, message: `请填写第${index + 1}个爱好` }]}
        >
          {({ value, error }: IFieldArguments) => (
            <div>
              <Input
                value={value}
                onChange={(e) => {
                  const newLikes = [...formData.likes];
                  newLikes[index] = e.target.value;
                  setFormData({
                    ...formData,
                    likes: newLikes,
                  });
                }}
              />
              <span>{error}</span>
            </div>
          )}
        </Field>
      ))}

      <div>
        <Button onClick={onSubmit}>提交</Button>
      </div>
    </div>
  );
};
export default FormDemo;
```
