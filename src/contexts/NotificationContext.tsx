import React, { createContext, useContext, useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../services/firebaseConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface NotificationContextType {
  unreadCount: number;
  lastViewedTime: Date | null;
  markAsViewed: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextType>({
  unreadCount: 0,
  lastViewedTime: null,
  markAsViewed: async () => {},
});

export const useNotifications = () => useContext(NotificationContext);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [lastViewedTime, setLastViewedTime] = useState<Date | null>(null);

  useEffect(() => {
    // Load last viewed time from AsyncStorage
    loadLastViewedTime();

    // Setup real-time listener for pending orders
    const ordersQuery = query(
      collection(db, 'orders'),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(ordersQuery, (snapshot) => {
      if (!lastViewedTime) {
        // Nếu chưa có thời gian xem, count tất cả
        setUnreadCount(snapshot.size);
      } else {
        // Đếm các đơn hàng tạo sau thời điểm xem cuối
        const newOrders = snapshot.docs.filter((doc) => {
          const orderData = doc.data();
          const createdAt = orderData.createdAt?.toDate?.() || new Date(orderData.createdAt || 0);
          return createdAt > lastViewedTime;
        });
        setUnreadCount(newOrders.length);
      }
    });

    return () => unsubscribe();
  }, [lastViewedTime]);

  const loadLastViewedTime = async () => {
    try {
      const savedTime = await AsyncStorage.getItem('admin_notifications_last_viewed');
      if (savedTime) {
        setLastViewedTime(new Date(savedTime));
      }
    } catch (error) {
      console.error('Error loading last viewed time:', error);
    }
  };

  const markAsViewed = async () => {
    const now = new Date();
    setLastViewedTime(now);
    setUnreadCount(0);
    
    try {
      await AsyncStorage.setItem('admin_notifications_last_viewed', now.toISOString());
    } catch (error) {
      console.error('Error saving last viewed time:', error);
    }
  };

  return (
    <NotificationContext.Provider value={{ unreadCount, lastViewedTime, markAsViewed }}>
      {children}
    </NotificationContext.Provider>
  );
};
