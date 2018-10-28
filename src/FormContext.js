import React from 'react';

const FormContext = React.createContext({
  fields: {},
  bindField: () => {}, // 绑定控件
  unbindField: () => {}, // 解绑控件
  validateField: () => {}, // 校验字段
  options: {}, // vform全局配置信息
  parentProps: null, // 父级props
});

export default FormContext;
