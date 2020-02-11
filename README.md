# react-form-validation
Form validation for React

## Install

```bash
$ tnpm install react-form-validation-hoc --save
```

## Usage
Please refer to [async-validator](https://github.com/yiminghe/async-validator) for verification rules

## Example
```javascript
import React from 'react';
import create from 'react-form-validation-hoc';

class MyForm extends React.Component {
  state = {
    name: '',
    sex: '',
    school: '',
  }

  handleSubmit = (event) => {
    event.preventDefault();
    this.props.validator.validateFields((errors, values) => {
      console.log(errors); // eg. { name: "please enter your name", data.sex: "Please fill in male or female", data.school: "school is required" }
      console.log(values); // eg. { name: "tony", data: { sex: "male", school: "ABC School" } }
    });
  }

  render() {
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
        <div>name error: <span style={{ color: 'red' }}>{errors.name}</span></div>

        <div>
          <FieldDecorator
            name={'data.sex'}
            value={this.state.sex}
            rules={[
              {
                validator(rule, value, callback) {
                  if (value === 'male' || value === 'female') {
                    callback();
                  } else {
                    callback('Please fill in male or female');
                  }
                },
              },
            ]}
          />
          sex:
          <input
            value={this.state.sex}
            onChange={(event) => {
              this.setState({
                sex: event.target.value,
              });
            }}
          />
        </div>
        <div>sex error: <span style={{ color: 'red' }}>{errors['data.sex']}</span></div>

        <div>
          <FieldDecorator
            name={'data.school'}
            value={this.state.school}
            rules={[
              { required: true, message: 'school is required' },
            ]}
          />
          School:
          <input
            value={this.state.school}
            onChange={(event) => {
              this.setState({
                school: event.target.value,
              });
            }}
          />
        </div>
        <div>school error: <span style={{ color: 'red' }}>{errors['data.school']}</span></div>

        <input type="submit" value="Submit" />
      </form>
    );
  }
}

export default create()(MyForm);
```


