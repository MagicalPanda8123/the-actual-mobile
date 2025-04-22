import React, { useEffect, useState, useRef } from 'react'
import { View, FlatList, StyleSheet, ActivityIndicator, Alert, TextInput } from 'react-native'
import { useAuth } from '../context/AuthContext' // Import useAuth
import { useSocket } from '../context/SocketContext' // Import useSocket
import config from '../config'
import ConversationItem from '../components/ConversationItem'

export default function ConversationsScreen({ navigation }) {
  const { token } = useAuth() // Get the JWT from AuthContext
  const { socket, isConnected } = useSocket() // Get the socket connection and connection status from SocketContext
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filteredConversations, setFilteredConversations] = useState([])
  const currentlyOpenedConversationId = useRef(null)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
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
          const mappedConversations = result.conversations.map((conversation) => ({
            conversationId: conversation.conversationId,
            name:
              conversation.type === 'ONE-TO-ONE'
                ? `${conversation.recipient?.profile?.firstName || 'Unknown'} ${conversation.recipient?.profile?.lastName || ''}`
                : conversation.groupName || 'Unnamed Group',
            avatar:
              conversation.type === 'ONE-TO-ONE'
                ? conversation.recipient?.profile?.avatar || require('../assets/avatar.png')
                : require('../assets/group-avatar.png'),
            lastMessageText: conversation.lastMessageText,
            lastMessageAt: conversation.lastMessageAt,
            unread: conversation.unread, // Include the unread field
            type: conversation.type
          }))

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

    // Listen for conversation updates from the socket
    if (socket && isConnected) {
      socket.on('new-conversation', () => {
        console.log('New conversation event received, re-fetching conversations...')
        fetchConversations() // Re-fetch conversations on new-conversation event
      })
    }

    // Cleanup the socket listener on unmount
    return () => {
      if (socket) {
        socket.off('new-conversation') // Remove the listener
      }
    }
  }, [socket, isConnected, token]) // Dependencies: socket, isConnected, and token

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredConversations(conversations)
    } else {
      const filtered = conversations.filter((conversation) => conversation.name.toLowerCase().includes(searchQuery.toLowerCase()))
      setFilteredConversations(filtered)
    }
  }, [conversations, searchQuery])

  const handleConversationUpdate = ({
    conversationId,
    lastMessageText,
    lastMessageAt,
    senderId // Include senderId in the event payload
  }) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.conversationId === conversationId)
      let updatedList

      if (existing) {
        const updatedConversation = {
          ...existing,
          lastMessageText,
          lastMessageAt,
          unread: senderId !== 'me' && conversationId !== currentlyOpenedConversationId.current
          // Set unread to true only if the sender is not the current user and the conversation is not currently opened
        }
        updatedList = [updatedConversation, ...prev.filter((c) => c.conversationId !== conversationId)]
      } else {
        updatedList = [
          {
            conversationId,
            name: 'Unknown', // Fetch if needed
            lastMessageText,
            lastMessageAt,
            unread: senderId !== 'me' // New conversations should be marked unread unless sent by the current user
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
    return [...list].sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt))
  }

  const handleSearch = (query) => {
    setSearchQuery(query)

    if (query.trim() === '') {
      setFilteredConversations(conversations)
      return
    }

    const filtered = conversations.filter((conversation) => conversation.name.toLowerCase().includes(query.toLowerCase()))
    setFilteredConversations(filtered)
  }

  // set unread to false when user opens the chat
  const handleConversationPress = (conversation) => {
    // Set the currently opened conversation ID
    currentlyOpenedConversationId.current = conversation.conversationId
    console.log(conversation.conversationId)

    // Update the unread status of the selected conversation to false
    setConversations((prev) =>
      prev.map((conv) =>
        conv.conversationId === conversation.conversationId
          ? { ...conv, unread: false } // Create a new object with updated unread property
          : conv
      )
    )

    console.log(conversation)

    // Emit open-conversation event to the server
    if (socket && isConnected) {
      socket.emit('open-conversation', {
        conversationId: conversation.conversationId
      })
    }

    // Navigate to the Chat screen and pass currentlyOpenedConversationId
    navigation.navigate('Chat', {
      conversationId: conversation.conversationId,
      recipientName: conversation.name,
      currentlyOpenedConversationId // Pass the ref value
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
      <TextInput style={styles.searchBar} placeholder="Search conversations..." value={searchQuery} onChangeText={handleSearch} placeholderTextColor="#aaa" />

      <FlatList
        data={filteredConversations}
        keyExtractor={(item) => item.conversationId}
        renderItem={({ item }) => <ConversationItem conversation={item} onPress={() => handleConversationPress(item)} />}
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
