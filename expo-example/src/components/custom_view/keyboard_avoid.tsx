import { TouchableWithoutFeedback } from 'react-native';
import { Keyboard } from 'react-native';
import React, { ReactNode } from 'react';

interface KeyboardAvoidProps {
  children: JSX.Element | JSX.Element[] | ReactNode;
}

export const KeyboardAvoid: React.FC<KeyboardAvoidProps> = (
  props: KeyboardAvoidProps
) => {
  const { children } = props;
  return (
    <TouchableWithoutFeedback
      onPress={() => {
        Keyboard.dismiss();
      }}
    >
      {children}
    </TouchableWithoutFeedback>
  );
};
