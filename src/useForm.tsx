import { useMemo } from 'react';
import ReactFormHelper from './ReactFormHelper.js';
import { IReactFormHelperOptions } from './types.js';

/**
 * 自定义hook
 * @param options 工厂函数参数对象
 * @returns
 */
const useForm = (options?: IReactFormHelperOptions) => {
  const instance = useMemo(() => {
    return new ReactFormHelper(options);
  }, []);
  return instance;
};
export default useForm;
