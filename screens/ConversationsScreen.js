import React, { useEffect, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  TextInput
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import config from '../config'
import ConversationItem from '../components/ConversationItem'

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('') // State for search query
  const [filteredConversations, setFilteredConversations] = useState([]) // State for filtered conversations

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = await AsyncStorage.getItem('token') // Retrieve the token from AsyncStorage
        if (!token) {
          Alert.alert('Error', 'Authentication token not found')
          return
        }

        const response = await fetch(`${config.BASE_URL}/api/conversations`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` // Add token to Authorization header
          }
        })

        const result = await response.json()

        if (response.ok) {
          setConversations(result.conversations) // Set the conversations in state
          setFilteredConversations(result.conversations) // Initialize filtered conversations
        } else {
          Alert.alert('Error', result.error || 'Failed to fetch conversations')
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchConversations()
  }, [])

  const handleSearch = async (query) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setFilteredConversations(conversations) // Reset to all conversations if query is empty
      return
    }

    try {
      const token = await AsyncStorage.getItem('token')
      if (!token) {
        Alert.alert('Error', 'Authentication token not found')
        return
      }

      const response = await fetch(
        `${config.BASE_URL}/api/conversations/search`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ query }) // Send the search query to the server
        }
      )

      const result = await response.json()

      if (response.ok) {
        setFilteredConversations(result.conversations) // Update filtered conversations
      } else {
        Alert.alert('Error', result.error || 'Failed to search conversations')
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong while searching.')
    }
  }

  const handleConversationPress = (conversation) => {
    const recipientName = `${conversation.recipient.profile.firstName} ${conversation.recipient.profile.lastName}`
    navigation.navigate('Chat', {
      conversationId: conversation.conversationId,
      recipientName
    })
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <TextInput
        style={styles.searchBar}
        placeholder="Search conversations..."
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor="#aaa"
      />

      {/* Conversations List */}
      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => (
          <ConversationItem
            conversation={item}
            onPress={() => handleConversationPress(item)}
          />
        )}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  searchBar: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 25,
    paddingHorizontal: 15,
    margin: 10,
    backgroundColor: '#f9f9f9'
  }
})
