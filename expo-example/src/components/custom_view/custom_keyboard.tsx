import { UIImages } from './../../../assets';
import React, { useCallback } from 'react';
import {
  FlatList,
  Image,
  ListRenderItemInfo,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { UIColors } from '../colors';

interface CustomKeyboardProps {
  callback: (key: string) => void;
  title: string;
  close: () => void;
}

export const CustomKeyboard = React.memo((props: CustomKeyboardProps) => {
  const { callback, title, close } = props;
  const keycapData = [
    '1',
    '2',
    '3',
    '4',
    '5',
    '6',
    '7',
    '8',
    '9',
    '*',
    '0',
    '#',
  ];
  const _renderItem = useCallback(
    (data: ListRenderItemInfo<string>) => {
      const { item } = data;
      return (
        <TouchableOpacity
          style={{
            padding: 12,
          }}
          onPress={() => {
            callback(item);
          }}
        >
          <Text style={styles.keyCap}>{item}</Text>
        </TouchableOpacity>
      );
    },
    [callback]
  );
  return (
    <View style={styles.background}>
      <View style={styles.option}>
        <Text style={styles.title}>{title}</Text>
        <TouchableOpacity onPress={close}>
          <Image source={UIImages.close} style={styles.close} />
        </TouchableOpacity>
      </View>
      <FlatList
        columnWrapperStyle={{ justifyContent: 'space-around' }}
        numColumns={3}
        data={keycapData}
        renderItem={_renderItem}
        keyExtractor={(item) => item}
        scrollEnabled={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  background: { width: '100%' },
  option: {
    flexDirection: 'row',
    paddingHorizontal: 40,
    alignItems: 'center',
    marginBottom: 12,
  },
  close: {
    width: 24,
    height: 24,
  },
  title: {
    fontSize: 24,
    color: UIColors.textColor,
    fontWeight: '700',
    flexGrow: 1,
    textAlign: 'center',
    marginLeft: 20,
  },
  keyCap: {
    fontSize: 24,
    color: UIColors.textColor,
  },
});
