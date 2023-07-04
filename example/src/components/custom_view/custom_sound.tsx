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

interface CustomSoundProps {
  callback: (key: any) => void;
  sounds: any[];
  close: () => void;
}

export const CustomSound = React.memo((props: CustomSoundProps) => {
  const { callback, sounds, close } = props;
  const _renderItem = useCallback(
    (data: ListRenderItemInfo<any>) => {
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
          <Text style={styles.keyCap}>{item.name}</Text>
        </TouchableOpacity>
      );
    },
    [callback]
  );
  return (
    <View style={styles.background}>
      <View style={styles.option}>
        <TouchableOpacity onPress={close}>
          <Image source={UIImages.close} style={styles.close} />
        </TouchableOpacity>
      </View>
      <FlatList
        numColumns={1}
        data={sounds}
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
    justifyContent: 'flex-end',
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
    fontSize: 16,
    color: UIColors.textColor,
  },
});
