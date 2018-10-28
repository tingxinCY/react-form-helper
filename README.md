# react-form-validation
Form validation for React

## Install

```bash
$ tnpm install @tingxin/react-form-validation --save
```

## Usage
Please refer to [async-validator](https://github.com/yiminghe/async-validator) for verification rules

## Example
```javascript
import React from 'react';
import create from '@tingxin/react-form-validation';

class MyForm extends React.Component {
  state = {
    name: '',
    data: {
      sex: '',
    },
  }

  handleChange(event) {
    this.setState({ name: event.target.value });
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.validator.validateFields((errors, values) => {
      console.log(errors);
      console.log(values);
    });
  }

  render() {
    console.log(this.props.validator);
    const { FieldDecorator, errors } = this.props.validator;
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <FieldDecorator
            name={'name'}
            value={this.state.name}
            rules={[
              { required: true, message: 'please enter your name' },
            ]}
          />
          name:
          <input
            value={this.state.name}
            onChange={(event) => {
              this.setState({
                name: event.target.value,
              });
            }}
          />
        </div>
        <div>name error: {errors.name}</div>
        <div>
          <FieldDecorator
            name={'data.sex'}
            value={this.state.data.sex}
            rules={[
              { required: true, message: 'sex is required' },
            ]}
          />
          sex:
          <select
            value={this.state.data.sex}
            onChange={(event) => {
              this.setState({
                data: {
                  sex: event.target.value,
                },
              });
            }}
          >
            <option value="">none</option>
            <option value="male">male</option>
            <option value="female">female</option>
          </select>
        </div>
        <div>sex error: {errors['data.sex']}</div>
        <input type="submit" value="Submit" />
      </form>
    );
  }
}

export default create()(MyForm);
```


