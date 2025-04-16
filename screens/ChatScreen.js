import React, { useEffect, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  Button,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client'
import MessageItem from '../components/MessageItem'

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipientName } = route.params
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)

  useEffect(() => {
    const initializeSocket = async () => {
      const token = await AsyncStorage.getItem('token')
      const user = JSON.parse(await AsyncStorage.getItem('user'))
      setUserId(user.id)

      // Connect to the Socket.IO server
      const newSocket = io('http://localhost:3000', {
        auth: { userId: user.id } // Pass userId for authentication
      })
      setSocket(newSocket)

      // Listen for new messages
      newSocket.on('new_message', (message) => {
        // console.log(`new message received : ${message.content}`)
        if (message.conversationId === conversationId) {
          setMessages((prevMessages) => [message, ...prevMessages])
        }
      })

      return () => {
        newSocket.disconnect() // Disconnect when the component unmounts
      }
    }

    initializeSocket()
  }, [conversationId])

  useEffect(() => {
    // fetch messages for the selected conversation
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const user = JSON.parse(await AsyncStorage.getItem('user'))
        setUserId(user.id)

        const response = await fetch(
          `http://localhost:3000/api/conversations/${conversationId}/messages?limit=3`,
          {
            method: 'GET',
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        )

        const result = await response.json()

        if (response.ok) {
          setMessages(result.messages)
        } else {
          Alert.alert('Error', result.error || 'Failed to fetch messages')
        }
      } catch (error) {
        Alert.alert('Error', 'Something went wrong. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [conversationId])

  useEffect(() => {
    // Change the chat screen metadata if the user switches to another convo
    navigation.setOptions({
      headerTitle: recipientName,
      headerTitleAlign: 'center',
      headerLeft: () => (
        <Text onPress={() => navigation.goBack()} style={styles.goBack}>
          Back
        </Text>
      ),
      headerRight: () => <Text style={styles.chatOptions}>Options</Text>
    })
  }, [navigation, recipientName])

  const handleSendMessage = () => {
    if (!newMessage.trim()) return

    const messageObject = {
      conversationId,
      content: newMessage,
      type: 'TEXT'
    }

    // Emit the message to the server
    socket.emit('send_message', messageObject)

    // Add the message to the local state
    setMessages((prevMessages) => [
      {
        ...messageObject,
        senderId: userId,
        messageId: Date.now().toString(),
        createdAt: new Date().toISOString()
      },
      ...prevMessages
    ])
    setNewMessage('')
  }

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.chatContainer}>
          <View style={styles.messageSection}>
            <FlatList
              data={[...messages].reverse()}
              keyExtractor={(item) => item.messageId}
              renderItem={({ item }) => (
                <MessageItem
                  message={item}
                  isOwnMessage={item.senderId === userId}
                />
              )}
              // inverted
              style={{ flex: 1 }}
              contentContainerStyle={styles.messageList} // Ensures proper spacing and scrollability
            />
          </View>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              value={newMessage}
              onChangeText={setNewMessage}
            />
            <Button title="Send" onPress={handleSendMessage} />
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
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
  chatContainer: {
    flex: 1 // Ensures the entire chat container takes up the full screen
  },
  messageSection: {
    flex: 1, // Ensures the message section takes up the remaining space
    overflow: 'hidden'
  },
  messageList: {
    justifyContent: 'flex-end', // Aligns messages to the bottom when inverted
    paddingBottom: 10 // Adds spacing to avoid overlap with the input section
  },
  inputContainer: {
    height: 60, // Fixed height for the input section
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderTopWidth: 1,
    borderTopColor: '#ccc',
    backgroundColor: '#f9f9f9'
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 20,
    padding: 10,
    marginRight: 10
  },
  goBack: {
    marginLeft: 10,
    color: '#007bff',
    fontSize: 16
  },
  chatOptions: {
    marginRight: 10,
    color: '#007bff',
    fontSize: 16
  }
})
