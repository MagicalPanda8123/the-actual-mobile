import React, { useEffect, useState } from 'react'
import {
  View,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import config from '../config'
import ConversationItem from '../components/ConversationItem'

export default function ConversationsScreen({ navigation }) {
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const token = await AsyncStorage.getItem('token') // Retrieve the token from AsyncStorage
        if (!token) {
          Alert.alert('Error', 'Authentication token not found')
          return
        }

        const response = await fetch(`${config.BASE_URL}/conversations`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}` // Add token to Authorization header
          }
        })

        const result = await response.json()

        if (response.ok) {
          setConversations(result.conversations) // Set the conversations in state
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
      <FlatList
        data={conversations}
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
  }
})
