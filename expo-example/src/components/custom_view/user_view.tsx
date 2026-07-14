import { Image, StyleSheet, Text, View } from 'react-native';
import React from 'react';
import { UIImages } from './../../../assets';

interface UserViewProps {
  full_name?: string;
  avatar_url?: string;
}

export const UserView = React.memo((props: UserViewProps) => {
  const { full_name, avatar_url } = props;
  return (
    <View style={styles.background}>
      <Text style={styles.title}>{full_name != null ? full_name : '...'}</Text>
      {avatar_url != null && avatar_url !== '' ? (
        <Image source={{ uri: avatar_url }} style={styles.avatar} />
      ) : (
        <Image source={UIImages.callingFace} style={styles.avatar} />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  background: {
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '500',
  },
  avatar: {
    width: 100,
    height: 100,
    marginTop: 16,
    borderRadius: 60,
  },
});
