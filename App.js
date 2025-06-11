import React, { useEffect, useState, useRef } from 'react';
import { Text, View, StyleSheet, ActivityIndicator, ImageBackground, Animated } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

const quotes = [
  "You are capable of amazing things.",
  "Stay positive, work hard, make it happen.",
  "Believe in yourself and all that you are.",
  "Success is not final, failure is not fatal.",
  "Push yourself, because no one else will do it for you."
];

export default function App() {
  const [quote, setQuote] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current; // initial opacity = 0
  const scheduleDailyNotification = async (dailyQuote) => {
    if (Device.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
  
      if (finalStatus === 'granted') {
        await Notifications.cancelAllScheduledNotificationsAsync();
  
        await Notifications.scheduleNotificationAsync({
          content: {
            title: "🌞 Your Daily Motivation",
            body: dailyQuote,  // now using the same quote
          },
          trigger: {
            hour: 8,
            minute: 0,
            repeats: true,
          },
        });
      } else {
        alert('Notification permissions denied!');
      }
    } else {
      alert('Must use physical device for notifications');
    }
  };
  

  useEffect(() => {
    const getDailyQuote = async () => {
      try {
        const storedDate = await AsyncStorage.getItem('quoteDate');
        const today = new Date().toDateString();

        if (storedDate === today) {
          const savedQuote = await AsyncStorage.getItem('dailyQuote');
          setQuote(savedQuote);
        } else {
          const randomIndex = Math.floor(Math.random() * quotes.length);
          const newQuote = quotes[randomIndex];
          await AsyncStorage.setItem('dailyQuote', newQuote);
          await AsyncStorage.setItem('quoteDate', today);
          setQuote(newQuote);
          scheduleDailyNotification(newQuote); // pass the same quote to notifications

        }
      } catch (e) {
        console.error('Error loading daily quote:', e);
      }
    };

    getDailyQuote();
    scheduleDailyNotification();
  }, []);

  // Start fade animation after quote is set
  useEffect(() => {
    if (quote) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true
      }).start();
    }
  }, [quote]);

  if (!quote) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#333" />
      </View>
    );
  }

  return (
    <ImageBackground
      source={{ uri: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?fit=crop&w=1050&q=80' }}
      style={styles.background}
      resizeMode="cover"
    >
      <View style={styles.overlay}>
        <Animated.Text style={[styles.quote, { opacity: fadeAnim }]}>
          {quote}
        </Animated.Text>
      </View>
    </ImageBackground>
  );
}

 

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.7)',
    justifyContent: 'center',
    padding: 20,
  },
  quote: {
    fontSize: 24,
    fontStyle: 'italic',
    textAlign: 'center',
    color: '#333',
  },
  container: {
    flex: 1,
    justifyContent: 'center',
  }
});

