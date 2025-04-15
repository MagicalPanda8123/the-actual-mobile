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
import MessageItem from '../components/MessageItem'

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipientName } = route.params
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [newMessage, setNewMessage] = useState('')

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const user = JSON.parse(await AsyncStorage.getItem('user'))
        setUserId(user.id)

        const response = await fetch(
          `http://localhost:3000/api/conversations/${conversationId}/messages`,
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

    const newMessageObject = {
      messageId: Date.now().toString(),
      createdAt: new Date().toISOString(),
      senderId: userId,
      type: 'TEXT',
      content: newMessage
    }
    setMessages((prevMessages) => [newMessageObject, ...prevMessages])
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
              data={messages}
              keyExtractor={(item) => item.messageId}
              renderItem={({ item }) => (
                <MessageItem
                  message={item}
                  isOwnMessage={item.senderId === userId}
                />
              )}
              inverted // Keeps the newest messages at the bottom
              contentContainerStyle={styles.messageList} // Ensures proper spacing
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
    flex: 8 // 80% of the remaining screen height
  },
  messageList: {
    paddingBottom: 10 // Adds spacing to avoid overlap with the input section
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
  },
  inputContainer: {
    flex: 2,
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
  }
})
