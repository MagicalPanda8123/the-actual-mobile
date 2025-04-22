import React from 'react'
import { View, Text, StyleSheet, Image, Dimensions } from 'react-native'

// Get the screen width
const { width: screenWidth } = Dimensions.get('window')

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
  const senderName = `${message.senderName || 'Unknown'}`.trim() // Combine first and last name

  return (
    <View style={[styles.messageContainer, isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer]}>
      {!isOwnMessage && <Image source={require('../assets/avatar.png')} style={styles.avatar} />}
      <View style={styles.messageContent}>
        {!isOwnMessage && <Text style={styles.senderName}>{senderName}</Text>}
        <Text style={[styles.messageText, !isOwnMessage && styles.otherMessageText]}>{message.content}</Text>
        <Text style={styles.messageTime}>{messageTime}</Text>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginVertical: 8, // Add vertical spacing between messages
    paddingHorizontal: 10
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderRadius: 15,
    padding: 12,
    marginVertical: 5,
    maxWidth: screenWidth * 0.5, // Restrict width to 50% of the screen
    marginRight: 10 // Add margin to the right for spacing
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderRadius: 15,
    padding: 12,
    marginVertical: 5,
    maxWidth: screenWidth * 0.5, // Restrict width to 50% of the screen
    marginLeft: 10 // Add margin to the left for spacing
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  messageContent: {
    flex: 1
  },
  messageText: {
    fontSize: 16,
    color: '#fff' // Default white text for own messages
  },
  otherMessageText: {
    color: '#000' // Black text for other users' messages
  },
  senderName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#555',
    marginBottom: 5
  },
  messageTime: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 5,
    alignSelf: 'flex-end'
  }
})
