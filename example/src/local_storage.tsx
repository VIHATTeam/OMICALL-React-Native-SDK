// src/shared/utils/LocalStorage.ts
import AsyncStorage from '@react-native-async-storage/async-storage';

export default class LocalStorage {
  /**
   * Lưu giá trị vào AsyncStorage.
   * @param key Khóa lưu trữ
   * @param value Giá trị có thể là string, number, boolean, object,...
   */
  static async setItem<T>(key: string, value: T): Promise<void> {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
    } catch (error) {
      console.error(`Error saving data [${key}]:`, error);
    }
  }

  /**
   * Lấy giá trị đã lưu và parse JSON về kiểu T.
   * @param key Khóa lưu trữ
   * @returns Giá trị kiểu T, hoặc null nếu không tồn tại / lỗi parse
   */
  static async getItem<T>(key: string): Promise<T | null> {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      if (jsonValue != null) {
        return JSON.parse(jsonValue) as T;
      }
      return null;
    } catch (error) {
      console.error(`Error reading data [${key}]:`, error);
      return null;
    }
  }

  /**
   * Lấy thẳng string (không parse JSON).
   * @param key Khóa lưu trữ
   * @returns String gốc, hoặc null nếu không tồn tại / lỗi
   */
  static async getString(key: string): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(key);
    } catch (error) {
      console.error(`Error reading string [${key}]:`, error);
      return null;
    }
  }

  /**
   * Xoá một mục trong AsyncStorage.
   * @param key Khóa cần xóa
   */
  static async removeItem(key: string): Promise<void> {
    try {
      await AsyncStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing data [${key}]:`, error);
    }
  }

  /**
   * Xoá tất cả AsyncStorage.
   */
  static async clearAll(): Promise<void> {
    try {
      await AsyncStorage.clear();
    } catch (error) {
      console.error('Error clearing AsyncStorage:', error);
    }
  }
}