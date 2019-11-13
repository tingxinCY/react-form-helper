export default {
  namespace: 'index',
  state: {
    name: '',
    sex: '',
    school: '',
  },
  reducers: {
    updateState(state, { data }) {
      return {
        ...state,
        ...data,
      };
    },
  },
};
