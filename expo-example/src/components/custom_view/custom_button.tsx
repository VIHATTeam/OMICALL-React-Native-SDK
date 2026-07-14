import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import React from 'react';

interface CustomButtonProps {
  title: string;
  callback: () => void;
  style?: ViewStyle | undefined;
}

export const CustomButton = (props: CustomButtonProps) => {
  const { title, callback, style } = props;
  return (
    <TouchableOpacity onPress={callback}>
      <View style={[styles.background, { ...style }]}>
        <Text style={styles.title}>{title}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  background: {
    backgroundColor: 'rgb(1,139,62)',
    height: 56,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 15,
    color: 'rgb(255,255,255)',
    fontWeight: '700',
  },
});
