import React from 'react';
import { TouchableOpacity, Text } from 'react-native';

const VerseItem = ({ verse, isBookmarked, onPress }) => {
  return (
    <TouchableOpacity onPress={() => onPress(verse)}>
      <Text style={{
        backgroundColor: isBookmarked ? '#FFEB3B' : 'transparent',
        padding: 4
      }}>
        {verse.number}. {verse.text}
      </Text>
    </TouchableOpacity>
  );
};

export default VerseItem;
