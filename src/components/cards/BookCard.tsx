import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';

//This defines what data the card needs
interface BookCardProps {
  title: string;
  author: string;
  coverUrl: string;
  onPress?: () => void; 
  width?: number; 
}

const BookCard = ({ title, author, coverUrl, onPress, width = 140 }: BookCardProps) => {
    const [imageError, setImageError] = useState(false);

  const fallbackImage = `https://via.placeholder.com/${width}x${Math.round(width * 1.5)}/1A1A1A/FFFFFF?text=No+Cover`;

  return (
    <Card style={[styles.card, { width }]} onPress={onPress}>
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