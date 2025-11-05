import { SendFriendRequestModal } from '@/components/send-friend-request-modal';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { UserSearchItem } from '@/components/user-search-item';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { acceptFriendRequest, searchUsers, type UserSearchResult } from '@/lib/api/friends';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function SearchUsersScreen() {
  const colorScheme = useColorScheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState<{ id: number; name: string } | null>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Thông báo', 'Vui lòng nhập số điện thoại, tên hoặc username để tìm kiếm');
      return;
    }

    if (query.trim().length < 2) {
      Alert.alert('Thông báo', 'Vui lòng nhập ít nhất 2 ký tự để tìm kiếm');
      return;
    }

    setLoading(true);
    setHasSearched(true);
    
    try {
      const data = await searchUsers(query.trim());
      setResults(data);
    } catch (error: any) {
      console.error('Search error:', error);
      Alert.alert('Lỗi', 'Không thể tìm kiếm. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = (userId: number, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setModalVisible(true);
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await acceptFriendRequest(requestId);
      Alert.alert('Thành công', 'Đã chấp nhận lời mời kết bạn!');
      // Refresh search results
      handleSearch();
    } catch (error: any) {
      console.error('Accept request error:', error);
      Alert.alert('Lỗi', 'Không thể chấp nhận lời mời. Vui lòng thử lại.');
    }
  };

  const handleModalSuccess = () => {
    // Refresh search results after sending request
    handleSearch();
  };

  const renderEmptyState = () => {
    if (loading) return null;

    if (!hasSearched) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="search"
            size={64}
            color={colorScheme === 'dark' ? '#666' : '#ccc'}
          />
          <ThemedText style={styles.emptyText}>
            Tìm kiếm bằng số điện thoại, tên hoặc username
          </ThemedText>
          <ThemedText style={styles.emptySubtext}>
            (Tối thiểu 2 ký tự)
          </ThemedText>
        </View>
      );
    }

    if (results.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons
            name="person-remove"
            size={64}
            color={colorScheme === 'dark' ? '#666' : '#ccc'}
          />
          <ThemedText style={styles.emptyText}>
            Không tìm thấy người dùng nào
          </ThemedText>
        </View>
      );
    }

    return null;
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ThemedView style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ThemedText type="title">Tìm kiếm</ThemedText>
        </View>

        {/* Search Input */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputWrapper}>
            <Ionicons
              name="search"
              size={20}
              color="#999"
              style={styles.searchIcon}
            />
            <TextInput
              style={styles.searchInput}
              placeholder="Số điện thoại, tên, username (tối thiểu 2 ký tự)..."
              placeholderTextColor="#999"
              value={query}
              onChangeText={setQuery}
              onSubmitEditing={handleSearch}
              returnKeyType="search"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <TouchableOpacity
                onPress={() => {
                  setQuery('');
                  setResults([]);
                  setHasSearched(false);
                }}
                style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color="#999" />
              </TouchableOpacity>
            )}
          </View>

          <TouchableOpacity
            style={[styles.searchButton, loading && styles.searchButtonDisabled]}
            onPress={handleSearch}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <ThemedText style={styles.searchButtonText}>Tìm</ThemedText>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        <FlatList
          data={results}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <UserSearchItem
              user={item}
              onSendRequest={handleSendRequest}
              onAcceptRequest={handleAcceptRequest}
            />
          )}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={results.length === 0 ? styles.emptyContainer : undefined}
        />

        {/* Send Friend Request Modal */}
        {selectedUser && (
          <SendFriendRequestModal
            visible={modalVisible}
            recipientId={selectedUser.id}
            recipientName={selectedUser.name}
            onClose={() => setModalVisible(false)}
            onSuccess={handleModalSuccess}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  searchButton: {
    backgroundColor: '#0a84ff',
    paddingHorizontal: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 80,
  },
  searchButtonDisabled: {
    opacity: 0.7,
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    opacity: 0.6,
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    opacity: 0.5,
  },
});
