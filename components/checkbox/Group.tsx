import classNames from 'classnames';
import omit from 'rc-util/lib/omit';
import * as React from 'react';
import { ConfigContext } from '../config-provider';
import type { CheckboxChangeEvent } from './Checkbox';
import Checkbox from './Checkbox';
import GroupContext from './GroupContext';

import useStyle from './style';

export type CheckboxValueType = string | number | boolean;

export interface CheckboxOptionType {
  label: React.ReactNode;
  value: CheckboxValueType;
  style?: React.CSSProperties;
  disabled?: boolean;
  title?: string;
  onChange?: (e: CheckboxChangeEvent) => void;
}

export interface AbstractCheckboxGroupProps {
  prefixCls?: string;
  className?: string;
  rootClassName?: string;
  options?: Array<CheckboxOptionType | string | number>;
  disabled?: boolean;
  style?: React.CSSProperties;
}

export interface CheckboxGroupProps extends AbstractCheckboxGroupProps {
  name?: string;
  defaultValue?: Array<CheckboxValueType>;
  value?: Array<CheckboxValueType>;
  onChange?: (checkedValue: Array<CheckboxValueType>) => void;
  children?: React.ReactNode;
}

const InternalCheckboxGroup: React.ForwardRefRenderFunction<HTMLDivElement, CheckboxGroupProps> = (
  {
    defaultValue,
    children,
    options = [],
    prefixCls: customizePrefixCls,
    className,
    rootClassName,
    style,
    onChange,
    ...restProps
  },
  ref,
) => {
  const { getPrefixCls, direction } = React.useContext(ConfigContext);

  const [value, setValue] = React.useState<CheckboxValueType[]>(
    restProps.value || defaultValue || [],
  );
  const [registeredValues, setRegisteredValues] = React.useState<CheckboxValueType[]>([]);

  React.useEffect(() => {
    if ('value' in restProps) {
      setValue(restProps.value || []);
    }
  }, [restProps.value]);

  const getOptions = () =>
    options.map((option) => {
      if (typeof option === 'string' || typeof option === 'number') {
        return {
          label: option,
          value: option,
        };
      }
      return option;
    });

  const cancelValue = (val: string) => {
    setRegisteredValues((prevValues) => prevValues.filter((v) => v !== val));
  };

  const registerValue = (val: string) => {
    setRegisteredValues((prevValues) => [...prevValues, val]);
  };

  const toggleOption = (option: CheckboxOptionType) => {
    const optionIndex = value.indexOf(option.value);
    const newValue = [...value];
    if (optionIndex === -1) {
      newValue.push(option.value);
    } else {
      newValue.splice(optionIndex, 1);
    }
    if (!('value' in restProps)) {
      setValue(newValue);
    }
    const opts = getOptions();
    onChange?.(
      newValue
        .filter((val) => registeredValues.includes(val))
        .sort((a, b) => {
          const indexA = opts.findIndex((opt) => opt.value === a);
          const indexB = opts.findIndex((opt) => opt.value === b);
          return indexA - indexB;
        }),
    );
  };

  const prefixCls = getPrefixCls('checkbox', customizePrefixCls);
  const groupPrefixCls = `${prefixCls}-group`;

  const [wrapSSR, hashId] = useStyle(prefixCls);

  const domProps = omit(restProps, ['value', 'disabled']);

  if (options && options.length > 0) {
    children = getOptions().map((option) => (
      <Checkbox
        prefixCls={prefixCls}
        key={option.value.toString()}
        disabled={'disabled' in option ? option.disabled : restProps.disabled}
        value={option.value}
        checked={value.includes(option.value)}
        onChange={option.onChange}
        className={`${groupPrefixCls}-item`}
        style={option.style}
        title={option.title}
      >
        {option.label}
      </Checkbox>
    ));
  }

  // eslint-disable-next-line react/jsx-no-constructed-context-values
  const context = {
    toggleOption,
    value,
    disabled: restProps.disabled,
    name: restProps.name,
    // https://github.com/ant-design/ant-design/issues/16376
    registerValue,
    cancelValue,
  };
  const classString = classNames(
    groupPrefixCls,
    {
      [`${groupPrefixCls}-rtl`]: direction === 'rtl',
    },
    className,
    rootClassName,
    hashId,
  );
  return wrapSSR(
    <div className={classString} style={style} {...domProps} ref={ref}>
      <GroupContext.Provider value={context}>{children}</GroupContext.Provider>
    </div>,
  );
};

export type { CheckboxGroupContext } from './GroupContext';
export { GroupContext };

const CheckboxGroup = React.forwardRef<HTMLDivElement, CheckboxGroupProps>(InternalCheckboxGroup);

export default React.memo(CheckboxGroup);
