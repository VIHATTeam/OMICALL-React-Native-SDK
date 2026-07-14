import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';
import { UIColors } from '../colors';

interface CheckBoxProps {
  title: string;
  checked?: boolean | false;
  callback: () => void;
  style?: ViewStyle | undefined;
}

export const CustomCheckBox = React.memo((props: CheckBoxProps) => {
  const { title, checked, callback, style } = props;
  return (
    <TouchableOpacity
      onPress={callback}
      style={[styles.background, { ...style }]}
    >
      <View
        style={[
          styles.parentCheck,
          { borderColor: checked ? 'rgb(1,139,62)' : UIColors.textColor },
        ]}
      >
        {checked ? <View style={styles.childCheck} /> : null}
      </View>
      <Text
        style={[
          styles.title,
          { color: checked ? 'rgb(1,139,62)' : UIColors.textColor },
        ]}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  background: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  parentCheck: {
    width: 16,
    height: 16,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  childCheck: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'rgb(1,139,62)',
  },
  title: {
    fontSize: 15,
    marginLeft: 8,
    fontWeight: '500',
  },
});
