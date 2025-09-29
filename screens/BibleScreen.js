import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  StatusBar,
  SafeAreaView,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
  TextInput,
  Modal,
  Alert,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Audio } from 'expo-av';
import KJV_bible from '../bible/KJV_bible.json';
import AsyncStorage from '@react-native-async-storage/async-storage';
import VerseItem from '../components/VerseItem';

// Bible data imports - you can add your bibleData.json here if needed
const bibleVersions = {
  KJV: require('../bible/KJV_bible.json'),
  // Add your bibleData.json if it's a different version
  // CUSTOM: require('../data/bibleData.json'),
};

const { width, height } = Dimensions.get('window');

// Main App Component
export default function BibleApp({ route }) {
  const [currentView, setCurrentView] = useState('reader');
  const [selectedVersion, setSelectedVersion] = useState('KJV');
  const [selectedBook, setSelectedBook] = useState('Genesis');
  const [selectedChapter, setSelectedChapter] = useState('1');
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [bookmarks, setBookmarks] = useState([]);
  const [savedVerses, setSavedVerses] = useState([]);
  const [fontSize, setFontSize] = useState(18);
  const [currentVerseIndex, setCurrentVerseIndex] = useState(0);
  const [showVerseNumbers, setShowVerseNumbers] = useState(true);
  const [selectedVerse, setSelectedVerse] = useState(null);
  const [showBookmarkModal, setShowBookmarkModal] = useState(false);
  

  // Initialize with route params or defaults
  useEffect(() => {
    const { book, chapter, version } = route?.params || {};
    if (book) setSelectedBook(book);
    if (chapter) setSelectedChapter(chapter);
    if (version) setSelectedVersion(version);
  }, [route?.params]);

  // Load verses when book/chapter/version changes
  useEffect(() => {
    loadVerses();
  }, [selectedBook, selectedChapter, selectedVersion]);

  useEffect(() => {
    loadBookmarks();
    loadSavedVerses();
  }, []);

  // Auto-save bookmarks and saved verses
  useEffect(() => {
    saveBookmarks();
  }, [bookmarks]);

  useEffect(() => {
    saveSavedVerses();
  }, [savedVerses]);

  const loadBookmarks = async () => {
    try {
      const data = await AsyncStorage.getItem('bookmarks');
      if (data) setBookmarks(JSON.parse(data));
    } catch (error) {
      console.error('Error loading bookmarks:', error);
    }
  };

  const loadSavedVerses = async () => {
    try {
      const data = await AsyncStorage.getItem('savedVerses');
      if (data) setSavedVerses(JSON.parse(data));
    } catch (error) {
      console.error('Error loading saved verses:', error);
    }
  };

  const saveBookmarks = async () => {
    try {
      await AsyncStorage.setItem('bookmarks', JSON.stringify(bookmarks));
    } catch (error) {
      console.error('Error saving bookmarks:', error);
    }
  };

  const saveSavedVerses = async () => {
    try {
      await AsyncStorage.setItem('savedVerses', JSON.stringify(savedVerses));
    } catch (error) {
      console.error('Error saving verses:', error);
    }
  };

  const loadVerses = () => {
    setLoading(true);
    try {
      const bible = bibleVersions[selectedVersion];
      
      if (bible && bible[selectedBook]) {
        const bookData = bible[selectedBook];
        
        if (bookData[selectedChapter]) {
          const chapterData = bookData[selectedChapter];
          
          const formattedVerses = Object.keys(chapterData).map(verseNumber => ({
            id: `${selectedBook}_${selectedChapter}_${verseNumber}`,
            number: parseInt(verseNumber),
            text: chapterData[verseNumber],
            reference: `${selectedBook} ${selectedChapter}:${verseNumber}`,
            book: selectedBook,
            chapter: selectedChapter,
            verse: verseNumber,
            bookmarked: bookmarks.some(b => b.reference === `${selectedBook} ${selectedChapter}:${verseNumber}`),
            saved: savedVerses.some(s => s.reference === `${selectedBook} ${selectedChapter}:${verseNumber}`)
          })).sort((a, b) => a.number - b.number);
          
          setVerses(formattedVerses);
        } else {
          console.warn(`Chapter ${selectedChapter} not found in ${selectedBook}`);
          setVerses([]);
        }
      } else {
        console.warn(`Book ${selectedBook} not found in Bible data`);
        setVerses([]);
      }
    } catch (error) {
      console.error('Error loading verses:', error);
      setVerses([]);
    } finally {
      setLoading(false);
    }
  };

  const handleVersePress = (verse) => {
    setSelectedVerse(verse);
    setShowBookmarkModal(true);
    
  };

  const handleBookmarkVerse = async () => {
    if (!selectedVerse) return;
    
    try {
      const reference = selectedVerse.reference;
      const isBookmarked = bookmarks.some(b => b.reference === reference);
      
      let updatedBookmarks;
      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter(b => b.reference !== reference);
        Alert.alert('Removed', 'Bookmark removed successfully');
      } else {
        updatedBookmarks = [...bookmarks, { ...selectedVerse, timestamp: Date.now() }];
        Alert.alert('Saved', 'Verse bookmarked successfully');
      }
      
      setBookmarks(updatedBookmarks);
      setShowBookmarkModal(false);
      setSelectedVerse(null);
      loadVerses(); // Refresh to update bookmark status
    } catch (error) {
      console.error('Error saving bookmark:', error);
      Alert.alert('Error', 'Failed to save bookmark');
    }
  };

  const handleSaveVerse = async () => {
    if (!selectedVerse) return;
    
    try {
      const reference = selectedVerse.reference;
      const isSaved = savedVerses.some(s => s.reference === reference);
      
      let updatedSavedVerses;
      if (isSaved) {
        updatedSavedVerses = savedVerses.filter(s => s.reference !== reference);
        Alert.alert('Removed', 'Verse removed from saved');
      } else {
        updatedSavedVerses = [...savedVerses, { ...selectedVerse, timestamp: Date.now() }];
        Alert.alert('Saved', 'Verse saved successfully');
      }
      
      setSavedVerses(updatedSavedVerses);
      setShowBookmarkModal(false);
      setSelectedVerse(null);
      loadVerses(); // Refresh to update save status
    } catch (error) {
      console.error('Error saving verse:', error);
      Alert.alert('Error', 'Failed to save verse');
    }
  };

  const toggleBookmark = async (verse) => {
    try {
      const reference = verse.reference;
      const isBookmarked = bookmarks.some(b => b.reference === reference);
      
      let updatedBookmarks;
      if (isBookmarked) {
        updatedBookmarks = bookmarks.filter(b => b.reference !== reference);
      } else {
        updatedBookmarks = [...bookmarks, { ...verse, timestamp: Date.now() }];
      }
      
      setBookmarks(updatedBookmarks);
      loadVerses(false);
    } catch (error) {
      console.error('Error toggling bookmark:', error);
    }
  };

  const toggleSaveVerse = async (verse) => {
    try {
      const reference = verse.reference;
      const isSaved = savedVerses.some(s => s.reference === reference);
      
      let updatedSavedVerses;
      if (isSaved) {
        updatedSavedVerses = savedVerses.filter(s => s.reference !== reference);
      } else {
        updatedSavedVerses = [...savedVerses, { ...verse, timestamp: Date.now() }];
      }
      
      setSavedVerses(updatedSavedVerses);
      
    } catch (error) {
      console.error('Error toggling save verse:', error);
    }
  };

  // Bible Books data
  const bibleBooks = [
    // Old Testament
    { name: 'Genesis', abbreviation: 'Gen', chapters: 50, testament: 'Old' },
    { name: 'Exodus', abbreviation: 'Exo', chapters: 40, testament: 'Old' },
    { name: 'Leviticus', abbreviation: 'Lev', chapters: 27, testament: 'Old' },
    { name: 'Numbers', abbreviation: 'Num', chapters: 36, testament: 'Old' },
    { name: 'Deuteronomy', abbreviation: 'Deu', chapters: 34, testament: 'Old' },
    { name: 'Joshua', abbreviation: 'Jos', chapters: 24, testament: 'Old' },
    { name: 'Judges', abbreviation: 'Jdg', chapters: 21, testament: 'Old' },
    { name: 'Ruth', abbreviation: 'Rut', chapters: 4, testament: 'Old' },
    { name: '1 Samuel', abbreviation: '1Sa', chapters: 31, testament: 'Old' },
    { name: '2 Samuel', abbreviation: '2Sa', chapters: 24, testament: 'Old' },
    { name: '1 Kings', abbreviation: '1Ki', chapters: 22, testament: 'Old' },
    { name: '2 Kings', abbreviation: '2Ki', chapters: 25, testament: 'Old' },
    { name: '1 Chronicles', abbreviation: '1Ch', chapters: 29, testament: 'Old' },
    { name: '2 Chronicles', abbreviation: '2Ch', chapters: 36, testament: 'Old' },
    { name: 'Ezra', abbreviation: 'Ezr', chapters: 10, testament: 'Old' },
    { name: 'Nehemiah', abbreviation: 'Neh', chapters: 13, testament: 'Old' },
    { name: 'Esther', abbreviation: 'Est', chapters: 10, testament: 'Old' },
    { name: 'Job', abbreviation: 'Job', chapters: 42, testament: 'Old' },
    { name: 'Psalm', abbreviation: 'Psa', chapters: 150, testament: 'Old' },
    { name: 'Proverbs', abbreviation: 'Pro', chapters: 31, testament: 'Old' },
    { name: 'Ecclesiastes', abbreviation: 'Ecc', chapters: 12, testament: 'Old' },
    { name: 'Song of Songs', abbreviation: 'SoS', chapters: 8, testament: 'Old' },
    { name: 'Isaiah', abbreviation: 'Isa', chapters: 66, testament: 'Old' },
    { name: 'Jeremiah', abbreviation: 'Jer', chapters: 52, testament: 'Old' },
    { name: 'Lamentations', abbreviation: 'Lam', chapters: 5, testament: 'Old' },
    { name: 'Ezekiel', abbreviation: 'Eze', chapters: 48, testament: 'Old' },
    { name: 'Daniel', abbreviation: 'Dan', chapters: 12, testament: 'Old' },
    { name: 'Hosea', abbreviation: 'Hos', chapters: 14, testament: 'Old' },
    { name: 'Joel', abbreviation: 'Joe', chapters: 3, testament: 'Old' },
    { name: 'Amos', abbreviation: 'Amo', chapters: 9, testament: 'Old' },
    { name: 'Obadiah', abbreviation: 'Oba', chapters: 1, testament: 'Old' },
    { name: 'Jonah', abbreviation: 'Jon', chapters: 4, testament: 'Old' },
    { name: 'Micah', abbreviation: 'Mic', chapters: 7, testament: 'Old' },
    { name: 'Nahum', abbreviation: 'Nah', chapters: 3, testament: 'Old' },
    { name: 'Habakkuk', abbreviation: 'Hab', chapters: 3, testament: 'Old' },
    { name: 'Zephaniah', abbreviation: 'Zep', chapters: 3, testament: 'Old' },
    { name: 'Haggai', abbreviation: 'Hag', chapters: 2, testament: 'Old' },
    { name: 'Zechariah', abbreviation: 'Zec', chapters: 14, testament: 'Old' },
    { name: 'Malachi', abbreviation: 'Mal', chapters: 4, testament: 'Old' },
    
    // New Testament
    { name: 'Matthew', abbreviation: 'Mat', chapters: 28, testament: 'New' },
    { name: 'Mark', abbreviation: 'Mar', chapters: 16, testament: 'New' },
    { name: 'Luke', abbreviation: 'Luk', chapters: 24, testament: 'New' },
    { name: 'John', abbreviation: 'Joh', chapters: 21, testament: 'New' },
    { name: 'Acts', abbreviation: 'Act', chapters: 28, testament: 'New' },
    { name: 'Romans', abbreviation: 'Rom', chapters: 16, testament: 'New' },
    { name: '1 Corinthians', abbreviation: '1Co', chapters: 16, testament: 'New' },
    { name: '2 Corinthians', abbreviation: '2Co', chapters: 13, testament: 'New' },
    { name: 'Galatians', abbreviation: 'Gal', chapters: 6, testament: 'New' },
    { name: 'Ephesians', abbreviation: 'Eph', chapters: 6, testament: 'New' },
    { name: 'Philippians', abbreviation: 'Phi', chapters: 4, testament: 'New' },
    { name: 'Colossians', abbreviation: 'Col', chapters: 4, testament: 'New' },
    { name: '1 Thessalonians', abbreviation: '1Th', chapters: 5, testament: 'New' },
    { name: '2 Thessalonians', abbreviation: '2Th', chapters: 3, testament: 'New' },
    { name: '1 Timothy', abbreviation: '1Ti', chapters: 6, testament: 'New' },
    { name: '2 Timothy', abbreviation: '2Ti', chapters: 4, testament: 'New' },
    { name: 'Titus', abbreviation: 'Tit', chapters: 3, testament: 'New' },
    { name: 'Philemon', abbreviation: 'Phm', chapters: 1, testament: 'New' },
    { name: 'Hebrews', abbreviation: 'Heb', chapters: 13, testament: 'New' },
    { name: 'James', abbreviation: 'Jam', chapters: 5, testament: 'New' },
    { name: '1 Peter', abbreviation: '1Pe', chapters: 5, testament: 'New' },
    { name: '2 Peter', abbreviation: '2Pe', chapters: 3, testament: 'New' },
    { name: '1 John', abbreviation: '1Jo', chapters: 5, testament: 'New' },
    { name: '2 John', abbreviation: '2Jo', chapters: 1, testament: 'New' },
    { name: '3 John', abbreviation: '3Jo', chapters: 1, testament: 'New' },
    { name: 'Jude', abbreviation: 'Jud', chapters: 1, testament: 'New' },
    { name: 'Revelation', abbreviation: 'Rev', chapters: 22, testament: 'New' },
  ];

  // Search functionality
  const searchVerses = () => {
    if (!searchQuery.trim()) return;
    
    const bible = bibleVersions[selectedVersion];
    const searchResults = [];
    const query = searchQuery.toLowerCase();
    
    Object.keys(bible).forEach(bookName => {
      Object.keys(bible[bookName]).forEach(chapterNumber => {
        Object.keys(bible[bookName][chapterNumber]).forEach(verseNumber => {
          const verseText = bible[bookName][chapterNumber][verseNumber];
          if (verseText.toLowerCase().includes(query)) {
            searchResults.push({
              book: bookName,
              chapter: chapterNumber,
              verse: verseNumber,
              text: verseText,
              reference: `${bookName} ${chapterNumber}:${verseNumber}`
            });
          }
        });
      });
    });
    
    console.log('Search results:', searchResults);
    // You can set these results to a state and display them
    // setSearchResults(searchResults);
  };

  // Render different views based on currentView state
  const renderCurrentView = () => {
    switch (currentView) {
      case 'books':
        return <BooksView />;
      case 'chapters':
        return <ChaptersView />;
      case 'bookmarks':
        return <BookmarksView />;
      case 'saved':
        return <SavedVersesView />;
      default:
        return <ReaderView />;
    }
  };

  // Books Selection View
  const BooksView = () => {
    const bible = bibleVersions[selectedVersion];
    const availableBooks = bible ? Object.keys(bible) : [];
    
    const oldTestamentBooks = availableBooks.filter(book => 
      ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy', 'Joshua', 'Judges', 'Ruth',
       '1 Samuel', '2 Samuel', '1 Kings', '2 Kings', '1 Chronicles', '2 Chronicles', 'Ezra',
       'Nehemiah', 'Esther', 'Job', 'Psalm', 'Proverbs', 'Ecclesiastes', 'Song of Songs',
       'Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel', 'Hosea', 'Joel', 'Amos',
       'Obadiah', 'Jonah', 'Micah', 'Nahum', 'Habakkuk', 'Zephaniah', 'Haggai', 'Zechariah',
       'Malachi'].includes(book)
    );
    
    const newTestamentBooks = availableBooks.filter(book => 
      ['Matthew', 'Mark', 'Luke', 'John', 'Acts', 'Romans', '1 Corinthians', '2 Corinthians',
       'Galatians', 'Ephesians', 'Philippians', 'Colossians', '1 Thessalonians', '2 Thessalonians',
       '1 Timothy', '2 Timothy', 'Titus', 'Philemon', 'Hebrews', 'James', '1 Peter', '2 Peter',
       '1 John', '2 John', '3 John', 'Jude', 'Revelation'].includes(book)
    );

    const selectBook = (bookName) => {
      setSelectedBook(bookName);
      setSelectedChapter('1');
      setCurrentView('chapters');
    };

    const getChapterCount = (bookName) => {
      return bible[bookName] ? Object.keys(bible[bookName]).length : 0;
    };

    return (
      <View style={styles.container}>
        <ScrollView style={styles.content}>
          {oldTestamentBooks.length > 0 && (
            <>
              <Text style={styles.testamentTitle}>Old Testament</Text>
              <View style={styles.booksGrid}>
                {oldTestamentBooks.map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={[
                      styles.bookItem,
                      selectedBook === book && styles.selectedBookItem
                    ]}
                    onPress={() => selectBook(book)}
                  >
                    <Text style={[
                      styles.bookName,
                      selectedBook === book && styles.selectedBookName
                    ]}>
                      {book}
                    </Text>
                    <Text style={styles.bookChapters}>{getChapterCount(book)} chapters</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {newTestamentBooks.length > 0 && (
            <>
              <Text style={styles.testamentTitle}>New Testament</Text>
              <View style={styles.booksGrid}>
                {newTestamentBooks.map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={[
                      styles.bookItem,
                      selectedBook === book && styles.selectedBookItem
                    ]}
                    onPress={() => selectBook(book)}
                  >
                    <Text style={[
                      styles.bookName,
                      selectedBook === book && styles.selectedBookName
                    ]}>
                      {book}
                    </Text>
                    <Text style={styles.bookChapters}>{getChapterCount(book)} chapters</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {oldTestamentBooks.length === 0 && newTestamentBooks.length === 0 && (
            <>
              <Text style={styles.testamentTitle}>All Books</Text>
              <View style={styles.booksGrid}>
                {availableBooks.map((book) => (
                  <TouchableOpacity
                    key={book}
                    style={[
                      styles.bookItem,
                      selectedBook === book && styles.selectedBookItem
                    ]}
                    onPress={() => selectBook(book)}
                  >
                    <Text style={[
                      styles.bookName,
                      selectedBook === book && styles.selectedBookName
                    ]}>
                      {book}
                    </Text>
                    <Text style={styles.bookChapters}>{getChapterCount(book)} chapters</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    );
  };

  // Chapters Selection View
  const ChaptersView = () => {
    const bible = bibleVersions[selectedVersion];
    let chapters = [];
    
    if (bible && bible[selectedBook]) {
      chapters = Object.keys(bible[selectedBook]).map(ch => parseInt(ch)).sort((a, b) => a - b);
    }

    const selectChapter = (chapter) => {
      setSelectedChapter(chapter.toString());
      setCurrentView('reader');
    };

    return (
      <View style={styles.container}>
        <Text style={styles.bookTitle}>{selectedBook}</Text>
        <ScrollView style={styles.content}>
          <View style={styles.chaptersGrid}>
            {chapters.map((chapter) => (
              <TouchableOpacity
                key={chapter}
                style={[
                  styles.chapterItem,
                  selectedChapter === chapter.toString() && styles.selectedChapterItem
                ]}
                onPress={() => selectChapter(chapter)}
              >
                <Text style={[
                  styles.chapterNumber,
                  selectedChapter === chapter.toString() && styles.selectedChapterNumber
                ]}>
                  {chapter}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>
    );
  };

  // Bookmarks View
  const BookmarksView = () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Bookmarks</Text>
      <FlatList
        data={bookmarks}
        keyExtractor={(item) => item.reference}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.savedItem}>
            <Text style={styles.savedReference}>{item.reference}</Text>
            <Text style={styles.savedText}>{item.text}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => toggleBookmark(item)}
            >
              <Ionicons name="bookmark" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No bookmarks yet. Tap on verses to bookmark them!</Text>
        }
      />
    </View>
  );

  // Saved Verses View
  const SavedVersesView = () => (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Saved Verses</Text>
      <FlatList
        data={savedVerses}
        keyExtractor={(item) => item.reference}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.savedItem}>
            <Text style={styles.savedReference}>{item.reference}</Text>
            <Text style={styles.savedText}>{item.text}</Text>
            <TouchableOpacity
              style={styles.removeButton}
              onPress={() => toggleSaveVerse(item)}
            >
              <Ionicons name="heart" size={20} color="#ff6b6b" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No saved verses yet. Tap on verses to save them!</Text>
        }
      />
    </View>
  );

  // Main Reader View
  const ReaderView = () => {
    const renderVerse = (verse, index) => (
      <TouchableOpacity 
        key={verse.number} 
        style={[
          styles.verseContainer,
          selectedVerse?.id === verse.id && styles.selectedVerseContainer
        ]}
        onPress={() => handleVersePress(verse)}
        activeOpacity={0.7}
      >
        <Text style={[styles.verseText, { fontSize }]}>
          {showVerseNumbers && (
            <Text style={styles.verseNumber}>
              {verse.number}{' '}
            </Text>
          )}
          {verse.text}
          {index < verses.length - 1 && ' '}
        </Text>
        
        <View style={styles.verseStatus}>
          {verse.bookmarked && (
            <Ionicons name="bookmark" size={12} color="#4CAF50" style={styles.statusIcon} />
          )}
          {verse.saved && (
            <Ionicons name="heart" size={12} color="#ff6b6b" style={styles.statusIcon} />
          )}
        </View>
      </TouchableOpacity>
    );

    return (
      <View style={styles.container}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#333" />
            <Text style={styles.loadingText}>Loading {selectedBook} {selectedChapter}...</Text>
          </View>
        ) : (
          <ScrollView 
            style={styles.readerContent}
            contentContainerStyle={styles.readerContentContainer}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.chapterHeader}>
              <Text style={styles.chapterTitle}>
                {selectedBook} {selectedChapter}
              </Text>
            </View>
            
            <View style={styles.versesContainer}>
              {verses.map((verse, index) => renderVerse(verse, index))}
            </View>
            
            <View style={styles.chapterNavigation}>
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const prevChapter = parseInt(selectedChapter) - 1;
                  if (prevChapter > 0) {
                    setSelectedChapter(prevChapter.toString());
                  }
                }}
                disabled={parseInt(selectedChapter) <= 1}
              >
                <Ionicons name="chevron-back" size={20} color={parseInt(selectedChapter) <= 1 ? "#ccc" : "#666"} />
                <Text style={[styles.navButtonText, parseInt(selectedChapter) <= 1 && { color: "#ccc" }]}>
                  Previous Chapter
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.navButton}
                onPress={() => {
                  const bible = bibleVersions[selectedVersion];
                  const maxChapter = bible[selectedBook] ? Object.keys(bible[selectedBook]).length : 0;
                  const nextChapter = parseInt(selectedChapter) + 1;
                  if (nextChapter <= maxChapter) {
                    setSelectedChapter(nextChapter.toString());
                  }
                }}
              >
                <Text style={styles.navButtonText}>Next Chapter</Text>
                <Ionicons name="chevron-forward" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFDD0" />

      <View style={styles.topNav}>
        {currentView !== 'reader' && (
          <TouchableOpacity onPress={() => setCurrentView('reader')}>
            <Ionicons name="arrow-back" size={24} color="#666" />
          </TouchableOpacity>
        )}
        
       <TouchableOpacity onPress={() => setShowSearch(true)}>
         <Image 
              source={require('../assets/search.png')} 
              style={{ width: 29, height: 28, }}
           />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.versionButton}
          onPress={() => setShowVersionModal(true)}
        >
          <Image 
              source={require('../assets/globe.png')} 
              style={{ width: 20, height: 20, }}
                />
          <Text style={styles.versionText}>{selectedVersion}</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={() => setFontSize(fontSize === 16 ? 18 : fontSize === 18 ? 22 : fontSize === 22 ? 26 : 16)}>
           <Image 
              source={require('../assets/text.png')} 
              style={{ width: 20, height: 20, }}
                />
        </TouchableOpacity>

        {currentView === 'reader' && (
          <TouchableOpacity onPress={() => setShowVerseNumbers(!showVerseNumbers)}>
            <Ionicons name="list" size={24} color={showVerseNumbers ? "#4CAF50" : "#666"} />
          </TouchableOpacity>
        )}
      </View>

      {/* Main Content */}
      {renderCurrentView()}

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentView('reader')}
        >
        <Image 
           source={require('../assets/reading-book.png')} 
          style={{ width: 29, height: 28,  }}
          />
         
          <Text style={[
            styles.navText,
            currentView === 'reader' && { color: "#4CAF50" }
          ]}>
            Read
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentView('books')}
        >
         <Image 
           source={require('../assets/bookshelf.png')} 
          style={{ width: 29, height: 28,  }}
          />
         
          <Text style={[
            styles.navText,
            currentView === 'books' && { color: "#4CAF50" }
          ]}>
            Books
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentView('bookmarks')}
        >
          <Image 
           source={require('../assets/save.png')} 
          style={{ width: 29, height: 28,  }}
          />
          <Text style={[
            styles.navText,
            currentView === 'bookmarks' && { color: "#4CAF50" }
          ]}>
            Bookmarks
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => setCurrentView('saved')}
        >
         <Image 
           source={require('../assets/heart.png')} 
          style={{ width: 29, height: 28,  }}
          />
          <Text style={[
            styles.navText,
            currentView === 'saved' && { color: "#4CAF50" }
          ]}>
            Saved
          </Text>
        </TouchableOpacity>
      </View>

      {/* Enhanced Bookmark Modal - Combines features from both versions */}
      <Modal 
        visible={showBookmarkModal} 
        animationType="slide" 
        transparent
        onRequestClose={() => setShowBookmarkModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.bookmarkModalBox}>
            {selectedVerse && (
              <>
                <Text style={styles.modalTitle}>
                  {selectedVerse.reference}
                </Text>
                <Text style={styles.modalVerseText}>
                  {selectedVerse.text}
                </Text>
                
                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      selectedVerse.bookmarked ? styles.removeButton : styles.bookmarkButton
                    ]}
                    onPress={handleBookmarkVerse}
                  >
                    <Ionicons 
                      name={selectedVerse.bookmarked ? "bookmark" : "bookmark-outline"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.modalButtonText}>
                      {selectedVerse.bookmarked ? 'Remove Bookmark' : 'Bookmark Verse'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[
                      styles.modalButton,
                      selectedVerse.saved ? styles.removeButton : styles.saveButton
                    ]}
                    onPress={handleSaveVerse}
                  >
                    <Ionicons 
                      name={selectedVerse.saved ? "heart" : "heart-outline"} 
                      size={20} 
                      color="#fff" 
                    />
                    <Text style={styles.modalButtonText}>
                      {selectedVerse.saved ? 'Remove from Saved' : 'Save Verse'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.modalButton, styles.cancelButton]}
                    onPress={() => setShowBookmarkModal(false)}
                  >
                    <Text style={styles.modalButtonText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Search Modal */}
      <Modal visible={showSearch} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.searchModal}>
            <View style={styles.searchHeader}>
              <TouchableOpacity onPress={() => setShowSearch(false)}>
                <Image 
                   source={require('../assets/close.png')} 
                   style={{ width: 20, height: 20,  }}
                   />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Search Bible</Text>
              <TouchableOpacity onPress={searchVerses}>
                <Text style={styles.searchButton}>Search</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.searchInput}
              placeholder="Search for verses..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={searchVerses}
            />
          </View>
        </View>
      </Modal>

      {/* Version Selection Modal */}
      <Modal visible={showVersionModal} animationType="slide" transparent>
        <View style={styles.modalContainer}>
          <View style={styles.versionModal}>
            <View style={styles.modalHeader}>
              <TouchableOpacity onPress={() => setShowVersionModal(false)}>
                <Ionicons name="close" size={24} color="#666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle}>Bible Version</Text>
            </View>
            {Object.keys(bibleVersions).map((version) => (
              <TouchableOpacity
                key={version}
                style={[
                  styles.versionItem,
                  selectedVersion === version && styles.selectedVersionItem
                ]}
                onPress={() => {
                  setSelectedVersion(version);
                  setShowVersionModal(false);
                }}
              >
                <Text style={[
                  styles.versionItemText,
                  selectedVersion === version && styles.selectedVersionText
                ]}>
                  {version} - {version === 'KJV' ? 'King James Version' : version}
                </Text>
                {selectedVersion === version && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDD0',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#333',
    fontSize: 16,
    marginTop: 8,
  },
  topNav: {
    paddingTop: 60,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  versionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#333',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  versionText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  
  // Reader Styles
  readerContent: {
    flex: 1,
  },
  readerContentContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  chapterHeader: {
    alignItems: 'center',
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  chapterTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  versesContainer: {
    paddingBottom: 32,
  },
  verseContainer: {
    position: 'relative',
    marginBottom: 4,
    paddingVertical: 2,
  },
  selectedVerseContainer: {
    backgroundColor: '#d1f7c4',
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  verseText: {
    lineHeight: 28,
    color: '#333',
    textAlign: 'justify',
  },
  verseNumber: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#999',
    verticalAlign: 'super',
  },
  verseStatus: {
    position: 'absolute',
    right: -30,
    top: 0,
    flexDirection: 'column',
    alignItems: 'center',
  },
  statusIcon: {
    marginVertical: 1,
  },
  chapterNavigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    marginTop: 24,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  navButtonText: {
    fontSize: 16,
    color: '#666',
    marginHorizontal: 4,
  },
  
  // Books View Styles
  testamentTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginVertical: 16,
  },
  booksGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  bookItem: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedBookItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#f0f8f0',
  },
  bookName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedBookName: {
    color: '#4CAF50',
  },
  bookChapters: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },
  
  // Chapters View Styles
  bookTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
  },
  chaptersGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  chapterItem: {
    width: '18%',
    aspectRatio: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedChapterItem: {
    borderColor: '#4CAF50',
    backgroundColor: '#4CAF50',
  },
  chapterNumber: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  selectedChapterNumber: {
    color: '#fff',
  },
  
  // Saved Items Styles
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    paddingVertical: 16,
  },
  savedItem: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  savedReference: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginBottom: 8,
  },
  savedText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  removeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 50,
    paddingHorizontal: 20,
  },
  
  // Bottom Navigation Styles
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  navText: {
    color: '#666',
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookmarkModalBox: {
    width: 300,
    backgroundColor: '#fff',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
    textAlign: 'center',
  },
  modalVerseText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  modalActions: {
    width: '100%',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    marginBottom: 10,
  },
  bookmarkButton: {
    backgroundColor: '#4CAF50',
  },
  saveButton: {
    backgroundColor: '#ff6b6b',
  },
  cancelButton: {
    backgroundColor: '#666',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
  },
  searchModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
  },
  versionModal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34,
    maxHeight: '50%',
  },
  searchHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  searchButton: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: '500',
  },
  searchInput: {
    margin: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  versionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  selectedVersionItem: {
    backgroundColor: '#f0f8f0',
  },
  versionItemText: {
    fontSize: 16,
    color: '#333',
  },
  selectedVersionText: {
    color: '#4CAF50',
    fontWeight: '500',
  },
});