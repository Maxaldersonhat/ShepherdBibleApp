import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { Platform } from 'react-native';
import QuickActions from 'react-native-quick-actions';
import Ionicons from 'react-native-vector-icons/Ionicons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import AsyncStorage from '@react-native-async-storage/async-storage';
// import * as Linking from 'expo-linking';

const { width } = Dimensions.get('window');

const API_BASE_URL = 'http://192.168.100.12:3000'; // Replace with your actual API URL

export default function HomeScreen({ navigation }) {
  const [verse, setVerse] = useState(null);
  const [verseLoading, setVerseLoading] = useState(true);
  const [verseError, setVerseError] = useState(null);

  useEffect(() => {
    fetchDailyVerse();
  }, []);

  const fetchDailyVerse = async () => {
    try {
      setVerseLoading(true);
      setVerseError(null);
      
      // Check if we have cached today's verse
      const today = new Date().toDateString();
      const cachedData = await AsyncStorage.getItem('dailyVerse');
      
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        if (parsed.date === today) {
          setVerse(parsed);
          setVerseLoading(false);
          return;
        }
      }
      
      // Fetch from API
      const response = await fetch(`${API_BASE_URL}/api/daily-verse`);
      const data = await response.json();
      
      if (data.success) {
        setVerse(data.data);
        // Cache the verse
        await AsyncStorage.setItem('dailyVerse', JSON.stringify(data.data));
      } else {
        setVerseError('Failed to load daily verse');
      }
    } catch (err) {
      setVerseError('Network error. Please check your connection.');
      console.error('Error fetching daily verse:', err);
      
      // Try to load last cached verse as fallback
      try {
        const cachedData = await AsyncStorage.getItem('dailyVerse');
        if (cachedData) {
          const parsed = JSON.parse(cachedData);
          setVerse(parsed);
          setVerseError('Showing cached verse (offline)');
        }
      } catch (cacheErr) {
        console.error('Error loading cached verse:', cacheErr);
      }
    } finally {
      setVerseLoading(false);
    }
  };

  const addToHomeScreen = async () => {
    if (!verse) return;

    try {
      Alert.alert(
        'Add to Home Screen',
        'Would you like to share this verse or create a shortcut?',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Verse', onPress: shareVerse, style: 'default' },
          { text: 'Add Daily Verse Shortcut', onPress: addVerseToHomeScreen, style: 'default' }
        ]
      );
    } catch (error) {
      console.error('Error with home screen action:', error);
      shareVerse();
    }
  };

  const addVerseToHomeScreen = async () => {
  if (!verse) return;

  try {
    if (Platform.OS === 'android') {
      Alert.alert(
        'Add to Home Screen',
        'To add daily verses to your home screen:',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Share Verse', 
            onPress: shareVerse,
            style: 'default' 
          },
          { 
            text: 'Bookmark Verse', 
            onPress: bookmarkVerse,
            style: 'default' 
          },
          {
            text: 'How to Add Widget',
            onPress: () => Alert.alert(
              'Add Widget Instructions',
              '1. Long press on your home screen\n2. Tap "Widgets"\n3. Find "Shepherd Bible App"\n4. Add the Daily Verse widget',
              [{ text: 'Got it!' }]
            ),
            style: 'default'
          }
        ]
      );
    } else {
      // iOS
      Alert.alert(
        'Add to Home Screen',
        'Choose an option:',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Share Verse', onPress: shareVerse },
          { text: 'Bookmark Verse', onPress: bookmarkVerse },
          {
            text: 'Add to Safari Reading List',
            onPress: () => Alert.alert(
              'Safari Reading List',
              'Open this verse in Safari and add it to your Reading List for quick access.',
              [{ text: 'OK' }]
            )
          }
        ]
      );
    }
    
  } catch (error) {
    console.error('Error with home screen action:', error);
    shareVerse();
  }
};
  const shareVerse = async () => {
    if (!verse) return;

    try {
      const message = `${verse.text}\n\n— ${verse.reference}\n\nShared from Shepherd Bible App`;
      
      const result = await Share.share({
        message: message,
        title: 'Daily Memory Verse',
      });

      if (result.action === Share.sharedAction) {
        console.log('Verse shared successfully');
      }
    } catch (error) {
      console.error('Error sharing verse:', error);
      Alert.alert('Error', 'Unable to share verse at this time.');
    }
  };

  const bookmarkVerse = async () => {
    if (!verse) return;
    
    try {
      const bookmarks = await AsyncStorage.getItem('bookmarkedVerses') || '[]';
      const parsedBookmarks = JSON.parse(bookmarks);
      
      const newBookmark = {
        ...verse,
        bookmarkedAt: new Date().toISOString()
      };
      
      parsedBookmarks.push(newBookmark);
      await AsyncStorage.setItem('bookmarkedVerses', JSON.stringify(parsedBookmarks));
      
      Alert.alert('Success', 'Verse bookmarked successfully!');
    } catch (error) {
      console.error('Error bookmarking verse:', error);
      Alert.alert('Error', 'Unable to bookmark verse.');
    }
  };

  const renderDailyVerseContent = () => {
    if (verseLoading) {
      return (
        <View style={styles.verseLoadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading today's verse...</Text>
        </View>
      );
    }

    if (verseError && !verse) {
      return (
        <View style={styles.verseErrorContainer}>
          <Text style={styles.errorText}>{verseError}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchDailyVerse}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        {verseError && (
          <Text style={styles.offlineIndicator}>{verseError}</Text>
        )}
        
        <Text style={styles.dailyVerseTitle}>Daily Memory Verse</Text>
        <Text style={styles.verseText}>
          {verse ? verse.text : "I can do all things through Christ who strengthens me."}
        </Text>
        <Text style={styles.verseReference}>
          {verse ? verse.reference : "Philippians 4:13"}
        </Text>
        
        {verse && verse.theme && (
          <View style={styles.themeContainer}>
            <Text style={styles.themeText}>#{verse.theme}</Text>
          </View>
        )}
        
        <TouchableOpacity style={styles.addToHomeButton} onPress={addToHomeScreen}>
          <Text style={styles.addToHomeText}>Add to Home Screen</Text>
        </TouchableOpacity>
      </>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      {/* Header */}
      <View style={styles.header}>
       <TouchableOpacity onPress={() => {
    // Add your notification action here
    console.log('Notifications pressed');
    // Example: navigation.navigate('Notifications');
   Alert.alert('Notifications', 'No new notifications');
  }}>
    <Image 
      source={require('../assets/notification.png')} 
      style={{ width: 26, height: 28, tintColor: '#374151' }}
    />
  </TouchableOpacity>
        <Text style={styles.headerTitle}>Shepherd Bible App</Text>
        <TouchableOpacity onPress={() => {Alert.alert('Settings', 'Settings screen not implemented yet');
          // navigation.navigate('Settings');
        }}>
          <Image 
           source={require('../assets/setting.png')} 
           style={{ width: 26, height: 28, tintColor: '#374151' }}
           />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Daily Memory Verse Card - Now Dynamic */}
        <View style={styles.dailyVerseCard}>
          <View style={styles.verseImageContainer}>
            <Image
              source={require('../assets/Homepage1.jpg')} 
              style={styles.verseImage}
            />
          </View>
          
          {renderDailyVerseContent()}
        </View>

        {/* Quick Access */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          <View style={styles.quickAccessGrid}>
            <TouchableOpacity 
              style={styles.quickAccessItem} 
              onPress={() => navigation.navigate('Bible')}
            >
             <Image 
               source={require('../assets/book.png')} 
               style={{ width: 29, height: 28, }}
                />
              <Text style={styles.quickAccessText}>Read Bible</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.quickAccessItem}>
              <Image 
               source={require('../assets/streaming.png')} 
               style={{ width: 29, height: 28, }}
                />
              <Text style={styles.quickAccessText}>Audio Bible</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessItem}>
              <Image 
               source={require('../assets/travel.png')} 
               style={{ width: 29, height: 28, }}
                />
              <Text style={styles.quickAccessText}>Bible Quests</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.quickAccessItem}>
              <Image 
               source={require('../assets/telegram.png')} 
               style={{ width: 29, height: 28, }}
                />
              <Text style={styles.quickAccessText}>Join{'\n'}Telegram</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Featured AR Story */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Featured AR Story</Text>
          <TouchableOpacity style={styles.arStoryCard}>
            <View style={styles.arImageContainer}>
              <Image
                source={require('../assets/Davidvsgoliath.jpg')}
                style={styles.arStoryImage}
              />
            </View>
            <Text style={styles.arStoryTitle}>David & Goliath</Text>
            <Text style={styles.arStoryDescription}>
              Experience the epic battle in your own space.
            </Text>
            <Text style={styles.arTapText}>Tap to open in AR</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Activity & Bookmarks */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Activity & Bookmarks</Text>
          
          <TouchableOpacity 
            style={styles.recentItem}
            onPress={() => navigation.navigate('Bible')}
          >
            <Image 
               source={require('../assets/open-book.png')} 
               style={{ width: 50, height: 50, }}
                />
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Last Opened Chapter</Text>
              <Text style={styles.recentSubtitle}>Matthew 5</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.recentItem}>
            <Image 
               source={require('../assets/bookmark.png')} 
               style={{ width: 31, height: 35, }}
                />
            <View style={styles.recentInfo}>
              <Text style={styles.recentTitle}>Bookmarked Verse</Text>
              <Text style={styles.recentSubtitle}>John 3:16</Text>
            </View>
          </TouchableOpacity>
        </View>
        
        {/* Bottom spacing */}
        <View style={{ height: 10 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 50,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  dailyVerseCard: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    overflow: 'hidden',
  },
  verseImageContainer: {
    height: 297,
    backgroundColor: '#f3e8d3',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verseImage: {
    width: 350,
    height: 297,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  // Updated Daily Verse Styles
  dailyVerseTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 20,
    marginHorizontal: 20,
    textAlign: 'center',
  },
  verseText: {
    fontSize: 16,
    color: '#6b7280',
    lineHeight: 24,
    marginTop: 12,
    marginHorizontal: 20,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  verseReference: {
    fontSize: 14,
    color: '#6366f1',
    marginTop: 8,
    marginHorizontal: 20,
    textAlign: 'center',
    fontWeight: '600',
  },
  themeContainer: {
    alignItems: 'center',
    marginTop: 8,
    marginHorizontal: 20,
  },
  themeText: {
    fontSize: 12,
    color: '#718096',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addToHomeButton: {
    backgroundColor: '#6366f1',
    paddingVertical: 12,
    marginHorizontal: 60,
    marginTop: 16,
    marginBottom: 20,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  addToHomeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  // Loading and Error States
  verseLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 40,
    marginHorizontal: 20,
  },
  loadingText: {
    color: '#718096',
    fontSize: 14,
    marginTop: 12,
  },
  verseErrorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    marginHorizontal: 20,
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  offlineIndicator: {
    color: '#f59e0b',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 16,
    marginHorizontal: 20,
    fontStyle: 'italic',
  },
  // Existing styles remain the same
  section: {
    marginHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: 16,
  },
  quickAccessGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessItem: {
    width: (width - 60) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
    minHeight: 50,
  },
  quickAccessText: {
    fontSize: 14,
    fontWeight: '500',
    alignItems: 'center',
    color: '#374151',
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 18,
  },
  arStoryCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  arImageContainer: {
    height: 160,
    backgroundColor: '#a7f3d0',
  },
  arStoryImage: {
    width: '100%',
    height: 160,
  },
  arStoryTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 16,
    marginHorizontal: 16,
  },
  arStoryDescription: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
    marginHorizontal: 16,
  },
  arTapText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
    marginHorizontal: 16,
    marginBottom: 16,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#f3f4f6',
  },
  recentInfo: {
    marginLeft: 16,
    flex: 1,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  recentSubtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
});