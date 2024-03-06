import {
  KeyboardTypeOptions,
  ReturnKeyTypeOptions,
  StyleSheet,
  TextInput,
  View,
  Text,
  ViewStyle,
} from 'react-native';
import React, { MutableRefObject } from 'react';

interface CustomTextFieldProps {
  style?: ViewStyle | undefined;
  placeHolder?: string;
  label?: string;
  keyboardType?: KeyboardTypeOptions | undefined;
  value?: string;
  isPassword?: boolean | false;
  returnKey?: ReturnKeyTypeOptions;
  nextFocus?: MutableRefObject<TextInput>;
  currentFocus?: MutableRefObject<TextInput>;
  onChange?: (text: string) => void;
}

export const CustomTextField = (props: CustomTextFieldProps) => {
  const {
    style,
    placeHolder,
    label,
    keyboardType,
    value,
    isPassword,
    returnKey,
    nextFocus,
    currentFocus,
    onChange,
  } = props;
  return (
    <View style={{ ...style }}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.background}>
        <TextInput
          onChangeText={onChange}
          ref={currentFocus}
          style={styles.textInput}
          placeholder={placeHolder}
          keyboardType={keyboardType}
          secureTextEntry={isPassword}
          returnKeyType={returnKey}
          defaultValue={value}
          onSubmitEditing={() => {
            nextFocus && nextFocus.current.focus();
          }}
        />
      </View>
    </View>
  );
};
const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgba(51,51,51,0.05)',
    borderRadius: 6,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  textInput: {
    fontSize: 15,
    color: 'red',
  },
  label: {
    fontSize: 15,
    color: 'black',
    marginBottom: 4,
  },
});
