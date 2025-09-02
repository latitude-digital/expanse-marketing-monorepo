import React, { useState, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Text, StyleSheet } from 'react-native';

interface EventSearchProps {
  onSearch: (query: string) => void;
  onSort: (sortBy: 'date' | 'name' | 'brand') => void;
  placeholder?: string;
  currentSort?: 'date' | 'name' | 'brand';
}

const EventSearch: React.FC<EventSearchProps> = ({
  onSearch,
  onSort,
  placeholder = 'Search events...',
  currentSort = 'date',
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortOptions, setShowSortOptions] = useState(false);

  const handleSearchChange = useCallback((text: string) => {
    setSearchQuery(text);
    onSearch(text);
  }, [onSearch]);

  const handleSort = useCallback((sortBy: 'date' | 'name' | 'brand') => {
    onSort(sortBy);
    setShowSortOptions(false);
  }, [onSort]);

  const getSortButtonText = () => {
    switch (currentSort) {
      case 'date': return 'Date';
      case 'name': return 'Name';
      case 'brand': return 'Brand';
      default: return 'Sort';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={handleSearchChange}
          placeholder={placeholder}
          placeholderTextColor="#999999"
          autoCapitalize="none"
          autoCorrect={false}
        />
        
        <TouchableOpacity
          style={styles.sortButton}
          onPress={() => setShowSortOptions(!showSortOptions)}
        >
          <Text style={styles.sortButtonText}>{getSortButtonText()}</Text>
        </TouchableOpacity>
      </View>

      {showSortOptions && (
        <View style={styles.sortOptions}>
          <TouchableOpacity
            style={[styles.sortOption, currentSort === 'date' && styles.activeSortOption]}
            onPress={() => handleSort('date')}
          >
            <Text style={[styles.sortOptionText, currentSort === 'date' && styles.activeSortOptionText]}>
              Date
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortOption, currentSort === 'name' && styles.activeSortOption]}
            onPress={() => handleSort('name')}
          >
            <Text style={[styles.sortOptionText, currentSort === 'name' && styles.activeSortOptionText]}>
              Name
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.sortOption, currentSort === 'brand' && styles.activeSortOption]}
            onPress={() => handleSort('brand')}
          >
            <Text style={[styles.sortOptionText, currentSort === 'brand' && styles.activeSortOptionText]}>
              Brand
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    backgroundColor: '#f8f9fa',
  },
  sortButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#257180',
    borderRadius: 8,
  },
  sortButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  sortOptions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  sortOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    borderRadius: 16,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  activeSortOption: {
    backgroundColor: '#257180',
    borderColor: '#257180',
  },
  sortOptionText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  activeSortOptionText: {
    color: '#ffffff',
  },
});

export default EventSearch;