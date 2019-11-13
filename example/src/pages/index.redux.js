import React from 'react';
// import create from 'react-form-validation-hoc';
import create from '../../../dist/vform.esm';
import { connect } from 'dva';

/**
 * index redux版本，改版本用来测试更改input内容时同时触发hoc的props和state更新
 */
class MyForm extends React.Component {
  handleSubmit = (event) => {
    event.preventDefault();
    this.props.validator.validateFields((errors, values) => {
      console.log(errors);
      console.log(values);
    });
  }

  render() {
    const { index, updateState } = this.props;
    const { FieldDecorator, errors } = this.props.validator;
    return (
      <form onSubmit={this.handleSubmit}>
        <div>
          <FieldDecorator
            name={'name'}
            value={index.name}
            rules={[
              { required: true, message: 'please enter your name' },
            ]}
          />
          name:
          <input
            value={index.name}
            onChange={(event) => {
              updateState({
                name: event.target.value,
              });
            }}
          />
        </div>
        <div>name error: <span style={{ color: 'red' }}>{errors.name}</span></div>

        <div>
          <FieldDecorator
            name={'data.sex'}
            value={index.sex}
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
            value={index.sex}
            onChange={(event) => {
              updateState({
                sex: event.target.value,
              });
            }}
          />
        </div>
        <div>sex error: <span style={{ color: 'red' }}>{errors['data.sex']}</span></div>

        <div>
          <FieldDecorator
            name={'data.school'}
            value={index.school}
            rules={[
              { required: true, message: 'school is required' },
            ]}
          />
          School:
          <input
            value={index.school}
            onChange={(event) => {
              updateState({
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

const mapStateToProps = ({ index }) => ({
  index,
});

const mapDispatchToProps = (dispatch) => ({
  updateState(data) {
    dispatch({ type: 'index/updateState', data });
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(create()(MyForm));
