import React from 'react'
import { View, Text, StyleSheet } from 'react-native'

// Helper function to format the time
const formatTime = (isoString) => {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }
  return new Date(isoString).toLocaleTimeString('en-US', options)
}

export default function MessageItem({ message, isOwnMessage }) {
  const messageTime = formatTime(message.createdAt) // Format the message time

  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessage : styles.otherMessage
      ]}>
      <Text style={styles.messageText}>{message.content}</Text>
      <Text style={styles.messageTime}>{messageTime}</Text>{' '}
      {/* Display the time */}
    </View>
  )
}

const styles = StyleSheet.create({
  messageContainer: {
    maxWidth: '70%',
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginVertical: 5,
    borderRadius: 15,
    margin: 8
  },
  ownMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff'
  },
  otherMessage: {
    alignSelf: 'flex-start',
    backgroundColor: 'gray'
  },
  messageText: {
    fontSize: 16,
    color: '#fff'
  },
  messageTime: {
    fontSize: 12,
    color: '#ddd',
    marginTop: 5,
    alignSelf: 'flex-end'
  }
})
