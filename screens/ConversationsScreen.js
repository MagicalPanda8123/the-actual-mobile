import React, { useEffect, useState, useRef } from 'react'
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
import io from 'socket.io-client'

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState([])
  const socketRef = useRef(null)
  const currentlyOpenedConversationId = useRef(null)

  useEffect(() => {
    const initializeSocket = async () => {
      try {
        const user = await AsyncStorage.getItem('user') // Retrieve the user object as a string
        if (!user) {
          console.error('User not found in AsyncStorage')
          return
        }

        const parsedUser = JSON.parse(user) // Parse the string into an object
        console.log('Parsed user:', parsedUser)

        const userId = parsedUser.id // Access the userId from the parsed object
        if (!userId) {
          console.error('User ID not found in the user object')
          return
        }

        // Initialize Socket.io connection
        socketRef.current = io(config.SOCKET_SERVER_URL, {
          transports: ['websocket'],
          auth: {
            userId // Pass the userId in the auth object
          }
        })

        socketRef.current.on('connect', () => {
          console.log('Socket connected')
        })

        socketRef.current.on('conversation-update', handleConversationUpdate)
      } catch (error) {
        console.error('Error initializing socket:', error)
      }
    }

    const fetchConversations = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        if (!token) {
          Alert.alert('Error', 'Authentication token not found')
          return
        }

        const response = await fetch(`${config.BASE_URL}/api/conversations`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (response.ok) {
          const mappedConversations = result.conversations.map(
            (conversation) => {
              if (conversation.type === 'ONE-TO-ONE') {
                return {
                  conversationId: conversation.conversationId,
                  name: `${
                    conversation.recipient?.profile?.firstName || 'Unknown'
                  } ${conversation.recipient?.profile?.lastName || ''}`,
                  avatar:
                    conversation.recipient?.profile?.avatar ||
                    require('../assets/avatar.png'),
                  lastMessageText: conversation.lastMessageText,
                  lastMessageAt: conversation.lastMessageAt,
                  type: conversation.type
                }
              } else if (conversation.type === 'GROUP') {
                return {
                  conversationId: conversation.conversationId,
                  name: conversation.groupName || 'Unnamed Group',
                  avatar:
                    conversation.groupImage ||
                    require('../assets/group-avatar.png'),
                  lastMessageText: conversation.lastMessageText,
                  lastMessageAt: conversation.lastMessageAt,
                  type: conversation.type
                }
              }
              return conversation
            }
          )

          setConversations(mappedConversations)
          setFilteredConversations(mappedConversations)
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
    initializeSocket()

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect()
      }
    }
  }, [])

  const handleConversationUpdate = ({
    conversationId,
    lastMessageText,
    lastMessageAt
  }) => {
    if (conversationId === currentlyOpenedConversationId.current) return

    console.log(
      `update event received: ${conversationId} - ${lastMessageText} - ${lastMessageAt}`
    )
    setConversations((prev) => {
      const existing = prev.find((c) => c.conversationId === conversationId)
      let updatedList

      if (existing) {
        const updatedConversation = {
          ...existing,
          lastMessageText,
          lastMessageAt,
          unread: true
        }
        updatedList = [
          updatedConversation,
          ...prev.filter((c) => c.conversationId !== conversationId)
        ]
      } else {
        updatedList = [
          {
            conversationId,
            name: 'Unknown', // Fetch if needed
            lastMessageText,
            lastMessageAt,
            unread: true
          },
          ...prev
        ]
      }

      const sortedList = sortConversations(updatedList)
      setFilteredConversations(sortedList) // Update filteredConversations
      return sortedList
    })
  }

  const sortConversations = (list) => {
    return [...list].sort(
      (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
    )
  }

  const handleSearch = (query) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter((conversation) =>
      conversation.name.toLowerCase().includes(query.toLowerCase())
    )
    setFilteredConversations(filtered)
  }

  const handleConversationPress = (conversation) => {
    currentlyOpenedConversationId.current = conversation.conversationId

    setConversations((prev) =>
      sortConversations(
        prev.map((conv) =>
          conv.conversationId === conversation.conversationId
            ? { ...conv, unread: false }
            : conv
        )
      )
    )

    navigation.navigate('Chat', {
      conversationId: conversation.conversationId,
      recipientName: conversation.name // Use the standardized 'name' field
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
      <TextInput
        style={styles.searchBar}
        placeholder="Search conversations..."
        value={searchQuery}
        onChangeText={handleSearch}
        placeholderTextColor="#aaa"
      />

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
