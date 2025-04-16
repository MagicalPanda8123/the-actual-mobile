import React, { useState } from 'react'
import {
  View,
  TextInput,
  FlatList,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import config from '../config'

export default function SearchUserScreen({ navigation }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)

  const handleSearch = async () => {
    console.log('Search button pressed')

    // Log the query value
    console.log('Query:', query)

    if (!query.trim()) {
      Alert.alert('Error', 'Please enter a search query.')
      return
    }

    setLoading(true)
    console.log('Loading set to true')

    try {
      // Log the base URL
      console.log('Base URL:', config.BASE_URL)

      // Retrieve the token
      const token = await AsyncStorage.getItem('token')
      console.log('Token:', token)

      if (!token) {
        Alert.alert('Error', 'Authentication token is missing.')
        setLoading(false)
        return
      }

      // Log the full URL
      const url = `${config.BASE_URL}/users/search?name=${encodeURIComponent(
        query
      )}`
      console.log('Full URL:', url)

      // Make the API request
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (response.ok && result.success) {
        setResults(result.data)
        console.log('Search Results:', result.data)
      } else {
        Alert.alert(
          'Error',
          result.message || 'Failed to fetch search results.'
        )
      }
    } catch (error) {
      console.error('Error:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
      console.log('Loading set to false')
    }
  }

  const handleStartConversation = async (recipientId) => {
    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        Alert.alert('Error', 'Authentication token is missing.')
        return
      }

      const url = `${config.BASE_URL}/conversations/one-to-one`
      const body = {
        recipientId,
        content: 'Hello !' // Default initial content
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
      console.log('Start Conversation Response:', result)

      if (response.ok) {
        const { conversationId } = result.conversation
        // Navigate to the ChatScreen with the conversationId
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
    // Use the default avatar if the avatar field is missing
    const avatarUrl = item.avatar
      ? `${config.BASE_URL}/${item.avatar}`
      : `${config.BASE_URL}/default/avatar.png`

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => {
          // Handle user selection (e.g., navigate or perform an action)
          console.log('Selected user:', item)
        }}>
        <View style={styles.resultContent}>
          {/* Avatar */}
          <Image
            source={require('../assets/avatar.png')}
            style={styles.avatar}
          />

          {/* User Info */}
          <View style={styles.userInfo}>
            <Text style={styles.resultName}>
              {item.profile.firstName} {item.profile.lastName}
            </Text>
            <Text style={styles.resultUsername}>@{item.username}</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            {/* Send Message Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Send message to:', item.username)
                // Navigate to chat screen or perform an action
                handleStartConversation(item.id)
              }}>
              <Text style={styles.actionButtonText}>✈️</Text>
            </TouchableOpacity>

            {/* Add Friend Button */}
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => {
                console.log('Add friend:', item.username)
                // Perform add friend action
                Alert.alert(
                  'Friend Request Sent',
                  `You sent a friend request to ${item.username}.`
                )
              }}>
              <Text style={styles.actionButtonText}>➕</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search Bar with Button */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchBar}
          placeholder="Search by name or username"
          value={query}
          onChangeText={setQuery}
        />
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
          ListEmptyComponent={
            <Text style={styles.noResults}>No results found</Text>
          }
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
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee'
  },
  resultContent: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  resultName: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  resultUsername: {
    fontSize: 14,
    color: '#666'
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
  },
  userInfo: {
    flex: 1
  },
  actionButtons: {
    flexDirection: 'row'
  },
  actionButton: {
    marginLeft: 10,
    padding: 5,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: 'green',
    backgroundColor: 'white'
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
})
