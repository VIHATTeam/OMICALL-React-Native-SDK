import AsyncStorage from '@react-native-async-storage/async-storage';

export default class LocalStorage {
  static async set(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (e) {
      console.error('Failed to save item to AsyncStorage', e);
    }
  }

  
  static async getString(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (e) {
      console.error('Failed to fetch item from AsyncStorage', e);
      return null;
    }
  }

  static async removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove item from AsyncStorage', e);
    }
  }


  static async clearAll() {
    try {
      await AsyncStorage.clear();
    } catch (e) {
      console.error('Failed to clear AsyncStorage', e);
    }
  }
}
