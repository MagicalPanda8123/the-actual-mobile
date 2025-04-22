import React, { useState } from 'react'
import { View, TextInput, FlatList, Text, StyleSheet, TouchableOpacity, Alert, Image } from 'react-native'
import config from '../config'
import { useAuth } from '../context/AuthContext' // Import useAuth for token retrieval

export default function SearchUserScreen({ navigation }) {
  const { token } = useAuth() // Retrieve the token from useAuth
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query.')
      return
    }

    setLoading(true)

    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token is missing.')
        setLoading(false)
        return
      }

      const url = `${config.BASE_URL}/api/users/search?name=${encodeURIComponent(query)}`
      console.log('Search URL:', url)

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()
      console.log('Server Response:', result)

      if (response.ok && result.success) {
        setResults(result.data)
      } else {
        Alert.alert('Error', result.message || 'Failed to fetch search results.')
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  const handleAddFriend = async (friendId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token is missing.')
        return
      }

      const url = `${config.BASE_URL}/api/friendships/request`
      const body = {
        friendId
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'Friend request sent successfully.')
      } else {
        Alert.alert('Error', result.message || 'Failed to send friend request.')
      }
    } catch (error) {
      console.error('Error sending friend request:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const handleStartConversation = async (recipientId) => {
    try {
      if (!token) {
        Alert.alert('Error', 'Authentication token is missing.')
        return
      }

      const url = `${config.BASE_URL}/conversations/one-to-one`
      const body = {
        recipientId,
        content: 'Hello!' // Default initial content
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      const result = await response.json()

      if (response.ok) {
        const { conversationId } = result.conversation
        navigation.navigate('Chat', { conversationId })
      } else {
        Alert.alert('Error', result.message || 'Failed to start conversation.')
      }
    } catch (error) {
      console.error('Error starting conversation:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const renderItem = ({ item }) => {
    const avatarUrl = item.profile.avatar
      ? { uri: item.profile.avatar } // Use the avatar from the profile if it exists
      : require('../assets/avatar.png') // Fallback to the default avatar

    const fullName = `${item.profile.firstName} ${item.profile.lastName}`
    const statusColor = item.status === 'ONLINE' ? 'green' : 'gray'

    return (
      <View style={styles.resultItem}>
        <Image source={avatarUrl} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.resultName}>{fullName}</Text>
          <Text style={styles.resultUsername}>@{item.username}</Text>
          <Text style={[styles.status, { color: statusColor }]}>
            {item.status === 'ONLINE' ? 'Online' : `Last seen: ${new Date(item.lastSeen).toLocaleString()}`}
          </Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={() => handleAddFriend(item.id)}>
            <Text style={styles.actionButtonText}>Add Friend</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput style={styles.searchBar} placeholder="Search by name or username" value={query} onChangeText={setQuery} />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>Search</Text>
        </TouchableOpacity>
      </View>

      {/* Results List */}
      {loading ? (
        <Text style={styles.loadingText}>Loading...</Text>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListEmptyComponent={<Text style={styles.noResults}>No results found</Text>}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20
  },
  searchBar: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10
  },
  searchButton: {
    marginLeft: 10,
    backgroundColor: '#007BFF',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 5
  },
  searchButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 15
  },
  userInfo: {
    flex: 1
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  resultUsername: {
    fontSize: 14,
    color: '#666'
  },
  status: {
    fontSize: 12,
    marginTop: 5
  },
  actionButtons: {
    flexDirection: 'row'
  },
  actionButton: {
    backgroundColor: '#28a745', // Green color for "Add Friend"
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 5,
    marginLeft: 10
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  },
  noResults: {
    textAlign: 'center',
    marginTop: 20,
    color: '#999'
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#007BFF'
  }
})
