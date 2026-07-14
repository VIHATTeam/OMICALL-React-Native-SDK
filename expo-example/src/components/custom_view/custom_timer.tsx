import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { UIColors } from '../colors';

export const CustomTimer = React.memo(() => {
  const [time, setTime] = useState(0);
  const timerRef = React.useRef(time);
  const timeToString = useMemo(() => {
    const minute = Math.floor(time / 60);
    const second = time % 60;
    const minuteString = minute < 10 ? '0' + minute : minute;
    const secondString = second < 10 ? '0' + second : second;
    return minuteString + ':' + secondString;
  }, [time]);

  useEffect(() => {
    const timerId = setInterval(() => {
      timerRef.current += 1;
      setTime(timerRef.current);
    }, 1000);
    return () => {
      clearInterval(timerId);
    };
  }, []);

  return (
    <View style={styles.background}>
      <Text style={styles.title}>{timeToString}</Text>
    </View>
  );
});

const styles = StyleSheet.create({
  background: {},
  title: {
    fontSize: 20,
    color: UIColors.textColor,
  },
});
