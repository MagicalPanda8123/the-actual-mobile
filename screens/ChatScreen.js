import React, { useEffect, useState, useRef } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Text,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity
} from 'react-native'
import { useAuth } from '../context/AuthContext' // Import useAuth
import { useSocket } from '../context/SocketContext' // Import useSocket
import MessageItem from '../components/MessageItem'
import config from '../config'

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipientName, currentlyOpenedConversationId } = route.params
  const { socket, isConnected } = useSocket() // Use the single socket connection from SocketContext
  const { token, user } = useAuth() // Get the JWT token from AuthContext
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [newMessage, setNewMessage] = useState('')
  const flatListRef = useRef(null)
  const [sending, setSending] = useState(false)

  useEffect(() => {
    if (socket && isConnected) {
      // Emit "open-conversation" event when the screen is opened
      socket.emit('open-conversation', { conversationId })

      // Listen for "new-message" events
      socket.on('new-message', handleNewMessage)
    }

    // Cleanup socket listeners and emit "close-conversation" on unmount
    return () => {
      if (socket) {
        // Emit "close-conversation" event
        socket.emit('close-conversation', { conversationId })

        // Reset the currently opened conversation id
        if (currentlyOpenedConversationId) {
          currentlyOpenedConversationId.current = null
        }

        // Remove "new-message" listener
        socket.off('new-message', handleNewMessage)
      }
    }
  }, [socket, isConnected, conversationId, currentlyOpenedConversationId])

  useEffect(() => {
    // Fetch messages for the selected conversation
    const fetchMessages = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/messages?limit=30`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (response.ok) {
          setMessages(result.messages)
          // Scroll to the bottom after messages load
          setTimeout(() => scrollToBottom(), 100)
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
  }, [conversationId, token])

  const handleNewMessage = (message) => {
    if (message.conversationId === conversationId) {
      setMessages((prevMessages) => [message, ...prevMessages])
      // Scroll to the bottom on the next render
      setTimeout(() => scrollToBottom(), 100)
    }
  }

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true })
    }
  }

  const handleSendMessage = () => {
    if (!newMessage.trim() || sending) return

    setSending(true)

    const messageObject = {
      conversationId,
      content: newMessage.trim(),
      type: 'TEXT'
    }

    // Emit "send-message" event to the server
    if (socket && isConnected) {
      socket.emit('send-message', messageObject)
    }

    // Add the message to the local state
    // setMessages((prevMessages) => [
    //   {
    //     ...messageObject,
    //     senderId: 'me', // Mark as sent by the current user
    //     messageId: Date.now().toString(),
    //     createdAt: new Date().toISOString()
    //   },
    //   ...prevMessages
    // ])

    // Clear the input field
    setNewMessage('')
    setTimeout(() => scrollToBottom(), 100)
    setSending(false)
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
        style={styles.keyboardAvoidingView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 135 : 70} // Adjust offset for iOS and Android
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.chatContainer}>
            <FlatList
              ref={flatListRef}
              data={messages}
              keyExtractor={(item) => item.messageId}
              renderItem={({ item }) => (
                <MessageItem
                  message={item}
                  isOwnMessage={item.senderId === user.id} // Compare senderId with the current user's ID
                />
              )}
              inverted={true}
              style={{ flex: 1 }}
              contentContainerStyle={styles.messageList}
              onContentSizeChange={scrollToBottom}
              onLayout={scrollToBottom}
            />
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline={true}
                maxHeight={100}
              />
              <TouchableOpacity
                style={[styles.sendButton, !newMessage.trim() ? styles.sendButtonDisabled : null]}
                onPress={handleSendMessage}
                disabled={!newMessage.trim() || sending}>
                {sending ? <ActivityIndicator size="small" color="#ffffff" /> : <Text style={styles.sendButtonText}>Send</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff'
  },
  keyboardAvoidingView: {
    flex: 1
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  chatContainer: {
    flex: 1
  },
  messageList: {
    paddingVertical: 10
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
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
    marginRight: 10,
    maxHeight: 100
  },
  sendButton: {
    backgroundColor: '#007bff',
    borderRadius: 25,
    width: 60,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc'
  },
  sendButtonText: {
    color: '#ffffff',
    fontWeight: 'bold'
  }
})
