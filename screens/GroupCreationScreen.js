import React, { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, Image, FlatList, Alert, StyleSheet } from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import config from '../config'
import { useAuth } from '../context/AuthContext'
import { useSocket } from '../context/SocketContext' // Import the socket context

export default function GroupCreationScreen({ navigation }) {
  const { token } = useAuth() // Get the JWT token from AuthContext
  const { socket } = useSocket() // Get the socket instance from SocketContext
  const [groupName, setGroupName] = useState('')
  const [groupImage, setGroupImage] = useState(null) // Optional group image
  const [friends, setFriends] = useState([]) // List of user's friends
  const [selectedFriends, setSelectedFriends] = useState([]) // Selected participants
  const [loading, setLoading] = useState(true)

  // Fetch user's friends
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` // Use the token from useAuth
          }
        })
        const result = await response.json()
        if (response.ok) {
          const mappedFriends = result.friends.map((friend) => ({
            userId: friend.userId,
            fullName: `${friend.profile.firstName} ${friend.profile.lastName}`.trim(),
            avatar: friend.profile.avatar || require('../assets/avatar.png') // Fallback to default avatar
          }))
          setFriends(mappedFriends)
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch friends')
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong while fetching friends')
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
  }, [token])

  // Handle selecting/deselecting a friend
  const toggleFriendSelection = (friendId) => {
    setSelectedFriends(
      (prev) =>
        prev.includes(friendId)
          ? prev.filter((id) => id !== friendId) // Deselect
          : [...prev, friendId] // Select
    )
  }

  // Handle group creation
  const handleCreateGroup = async () => {
    const participantIds = selectedFriends
    if (participantIds.length < 2) {
      Alert.alert('Error', 'You must select at least 2 friends to create a group')
      return
    }

    const requestBody = {
      participantIds,
      groupName: groupName.trim() || undefined // Optional group name
    }

    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/group`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` // Use the token from useAuth
        },
        body: JSON.stringify(requestBody)
      })

      const result = await response.json()
      if (response.ok) {
        // Extract participantIds from result.participants
        const participantIds = result.participants.map((participant) => participant.userId)

        // Emit the socket event to notify participants
        if (socket) {
          socket.emit('new-conversation', {
            conversationId: result.conversation.conversationId, // Corrected access
            participantIds // Extracted participant IDs
          })
        }

        Alert.alert('Success', 'Group created successfully')
        navigation.goBack() // Navigate back to ConversationsScreen
      } else {
        Alert.alert('Error', result.message || 'Failed to create group')
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while creating the group')
    }
  }

  // Handle picking a group image
  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5
    })

    if (!result.canceled) {
      setGroupImage(result.uri)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Group Name (Optional)</Text>
      <TextInput style={styles.input} placeholder="Enter group name" value={groupName} onChangeText={setGroupName} />

      <Text style={styles.label}>Group Image (Optional)</Text>
      <TouchableOpacity onPress={handlePickImage} style={styles.imagePicker}>
        {groupImage ? <Image source={{ uri: groupImage }} style={styles.image} /> : <Text style={styles.imageText}>Pick an Image</Text>}
      </TouchableOpacity>

      <Text style={styles.label}>Select Friends</Text>
      {loading ? (
        <Text style={styles.loadingText}>Loading friends...</Text>
      ) : (
        <FlatList
          data={friends}
          keyExtractor={(item) => item.userId}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.friendItem, selectedFriends.includes(item.userId) && styles.selectedFriend]}
              onPress={() => toggleFriendSelection(item.userId)}>
              <View style={styles.friendRow}>
                <Image source={item.avatar} style={styles.friendAvatar} />
                <Text style={styles.friendName}>{item.fullName}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <TouchableOpacity
        style={[styles.createButton, selectedFriends.length >= 2 ? styles.createButtonEnabled : styles.createButtonDisabled]}
        onPress={handleCreateGroup}
        disabled={selectedFriends.length < 2}>
        <Text style={styles.createButtonText}>Create Group</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#f9f9f9'
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  imagePicker: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    backgroundColor: '#fff'
  },
  imageText: {
    color: '#888'
  },
  image: {
    width: 100,
    height: 100,
    borderRadius: 50
  },
  friendItem: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#fff'
  },
  selectedFriend: {
    backgroundColor: '#d0f0c0',
    borderColor: '#4caf50'
  },
  friendRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  friendAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12
  },
  friendName: {
    fontSize: 16,
    color: '#333'
  },
  loadingText: {
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 16
  },
  createButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16
  },
  createButtonEnabled: {
    backgroundColor: '#4caf50'
  },
  createButtonDisabled: {
    backgroundColor: '#ccc'
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
})
