import React from 'react';
import { StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';

interface GenrePillProps {
  label: string;
  onPress: () => void;
  selected?: boolean;
}

const GenrePill = ({ label, onPress, selected }: GenrePillProps) => {
  return (
    <Chip 
      mode="flat" 
      selected={selected}
      onPress={onPress}
      style={[styles.pill, selected && styles.selectedPill]}
      textStyle={[styles.text, selected && styles.selectedText]}
    >
      {label}
    </Chip>
  );
};

const styles = StyleSheet.create({
  pill: {
    marginRight: 8,
    backgroundColor: '#2A2A2A', // Deep grey for unselected
    borderRadius: 20,
  },
  selectedPill: {
    backgroundColor: '#FFFFFF', // White when selected
  },
  text: {
    color: '#E0E0E0', // Light grey for unselected
    fontSize: 12,
    textTransform: 'capitalize',
  },
  selectedText: {
    color: '#000000', // Black text when selected (for contrast on white background)
  },
});

export default GenrePill;