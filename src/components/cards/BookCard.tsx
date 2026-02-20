import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { router } from 'expo-router';

//This defines what data the card needs
interface BookCardProps {
  title: string;
  author: string;
  coverUrl: string;
  bookId?: string; // Add bookId for navigation
  onPress?: () => void; 
  width?: number; 
}

const BookCard = ({ title, author, coverUrl, bookId, onPress, width = 140 }: BookCardProps) => {
    const [imageError, setImageError] = useState(false);

  const fallbackImage = `https://via.placeholder.com/${width}x${Math.round(width * 1.5)}/1A1A1A/FFFFFF?text=No+Cover`;

  const handlePress = () => {
    if (bookId) {
      // Extract the work ID from the key (e.g., "/works/OL1234567W" -> "OL1234567W")
      const workId = bookId.replace('/works/', '');
      router.push(`/book/${workId}`);
    } else if (onPress) {
      onPress();
    }
  };

  return (
    <Card style={[styles.card, { width }]} onPress={handlePress}>
        <Card.Cover 
          source={{ uri: imageError ? fallbackImage : coverUrl || fallbackImage }} 
          onError={() => setImageError(true)}
          style={[styles.cover, { height: width * 1.5 }]}
        />

        <Card.Content style={styles.content}>
          <Text variant="titleMedium" numberOfLines={2} style={styles.title}>
            {title}</Text>
          <Text variant="bodySmall" numberOfLines={1} style={styles.author}>
            {author}</Text>
        </Card.Content>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginRight: 12,
    backgroundColor: '#1A1A1A',
    marginBottom: 8,
  },
  cover: {
    borderRadius: 8,
  },
  content: {
    paddingTop: 8,
  },
  title: {
    color: '#FFFFFF',
  },
  author: {
    color: '#B0B0B0',
  },
});

export default BookCard;