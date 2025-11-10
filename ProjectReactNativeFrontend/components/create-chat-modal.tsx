import { Ionicons } from '@expo/vector-icons';
import { useState, useEffect, useMemo } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { getFriendsList, type FriendProfile } from '@/lib/api/friends';
import { useCreateConversation } from '@/hooks/api/use-conversations';
interface CreateChatModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: (conversationId: number) => void;
}
type ChatType = 'GROUP';
export function CreateChatModal({ visible, onClose, onSuccess }: CreateChatModalProps) {
  const [groupName, setGroupName] = useState('');
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [friends, setFriends] = useState<FriendProfile[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const createConversationMutation = useCreateConversation();
  // Load friends list
  useEffect(() => {
    if (visible) {
      setLoadingFriends(true);
      getFriendsList()
        .then((friendsList) => {
          // Handle empty list gracefully
          if (Array.isArray(friendsList)) {
            setFriends(friendsList);
          } else {
            setFriends([]);
          }
        })
        .catch((error) => {// Set empty array instead of showing alert
          setFriends([]);
          // Only show alert if it's not a 400 error (which might mean no friends)
          if (error?.status !== 400) {
            Alert.alert('Lỗi', 'Không thể tải danh sách bạn bè');
          }
        })
        .finally(() => {
          setLoadingFriends(false);
        });
    }
  }, [visible]);
  // Reset form when modal closes
  useEffect(() => {
    if (!visible) {
      setGroupName('');
      setSelectedParticipants([]);
      setSearchQuery('');
    }
  }, [visible]);
  // Filter friends based on search query
  const filteredFriends = useMemo(() => {
    if (!searchQuery.trim()) {
      return friends;
    }
    const query = searchQuery.toLowerCase().trim();
    return friends.filter(
      (friend) =>
        friend.displayName?.toLowerCase().includes(query) ||
        friend.username.toLowerCase().includes(query),
    );
  }, [friends, searchQuery]);
  const toggleParticipant = (userId: number) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(userId)) {
        return prev.filter((id) => id !== userId);
      }
      return [...prev, userId];
    });
  };
  const handleCreate = async () => {
    if (!groupName.trim()) {
      Alert.alert('Lỗi', 'Vui lòng nhập tên nhóm');
      return;
    }
    if (selectedParticipants.length < 2) {
      Alert.alert('Lỗi', 'Vui lòng chọn ít nhất 2 thành viên (tổng cộng tối thiểu 3 người bao gồm bạn)');
      return;
    }
    try {
      const payload: CreateConversationRequest = {
        type: 'GROUP',
        participantIds: selectedParticipants,
        groupName: groupName.trim(),
      };
      const response = await createConversationMutation.mutateAsync(payload);
      onSuccess(response.id);
      onClose();
    } catch (error) {Alert.alert('Lỗi', 'Không thể tạo cuộc trò chuyện. Vui lòng thử lại.');
    }
  };
  const renderFriendItem = ({ item }: { item: FriendProfile }) => {
    const isSelected = selectedParticipants.includes(item.id);
    return (
      <TouchableOpacity
        style={[styles.friendItem, isSelected && styles.friendItemSelected]}
        onPress={() => toggleParticipant(item.id)}
        activeOpacity={0.7}>
        <Image
          source={{ uri: item.avatarUrl || 'https://i.pravatar.cc/150' }}
          style={styles.friendAvatar}
        />
        <View style={styles.friendInfo}>
          <Text style={styles.friendName}>{item.displayName || item.username}</Text>
          <Text style={styles.friendUsername}>@{item.username}</Text>
        </View>
        {isSelected && (
          <View style={styles.checkmark}>
            <Ionicons name="checkmark-circle" size={24} color="#007AFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };
  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Tạo cuộc trò chuyện</Text>
          <View style={styles.placeholder} />
        </View>
        {/* Group Name Input */}
        <View style={styles.groupNameContainer}>
          <TextInput
            style={styles.groupNameInput}
            placeholder="Nhập tên nhóm"
            placeholderTextColor="#999"
            value={groupName}
            onChangeText={setGroupName}
            maxLength={50}
          />
        </View>
        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#999" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm bạn bè..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        {/* Friends List */}
        {loadingFriends ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
          </View>
        ) : (
          <FlatList
            data={filteredFriends}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderFriendItem}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchQuery
                    ? 'Không tìm thấy bạn bè'
                    : friends.length === 0 && !loadingFriends
                      ? 'Chưa có bạn bè. Hãy kết bạn trước khi tạo nhóm chat.'
                      : 'Chưa có bạn bè'}
                </Text>
              </View>
            }
          />
        )}
        {/* Selected Count & Create Button */}
        {selectedParticipants.length > 0 && (
          <View style={styles.footer}>
            <Text style={styles.selectedCount}>
              Đã chọn: {selectedParticipants.length} {selectedParticipants.length === 1 ? 'người' : 'người'}
              {selectedParticipants.length < 2 && (
                <Text style={styles.warningText}> (Cần thêm {2 - selectedParticipants.length} người nữa)</Text>
              )}
            </Text>
            <TouchableOpacity
              style={[
                styles.createButton,
                (createConversationMutation.isPending || selectedParticipants.length < 2) && styles.createButtonDisabled,
              ]}
              onPress={handleCreate}
              disabled={createConversationMutation.isPending || selectedParticipants.length < 2}>
              {createConversationMutation.isPending ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.createButtonText}>Tạo</Text>
              )}
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  groupNameContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  groupNameInput: {
    height: 44,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    fontSize: 16,
    color: '#000',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e0e0e0',
  },
  friendItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  friendAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#d0d5dd',
    marginRight: 12,
  },
  friendInfo: {
    flex: 1,
  },
  friendName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  friendUsername: {
    fontSize: 14,
    color: '#999',
  },
  checkmark: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e0e0e0',
    backgroundColor: '#fff',
  },
  selectedCount: {
    fontSize: 14,
    color: '#666',
  },
  warningText: {
    fontSize: 14,
    color: '#ff9500',
    fontWeight: '600',
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
    minWidth: 80,
    alignItems: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});