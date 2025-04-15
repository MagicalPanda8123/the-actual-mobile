import React from 'react'
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native'

// Helper function to format the date
const formatTime = (isoString) => {
  const options = {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }
  return new Date(isoString).toLocaleTimeString('en-US', options)
}

const formatDateTime = (isoString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Asia/Bangkok'
  }
  return new Date(isoString).toLocaleString('en-US', options)
}

export default function ConversationItem({ conversation, onPress }) {
  const recipient = conversation.recipient
  const avatar = recipient.profile.avatar || require('../assets/avatar.png') // Use default avatar if not present
  const lastMessageTime = formatTime(conversation.lastMessageAt) // Format the last message time
  const lastMessageDateTime = formatDateTime(conversation.lastMessageAt)

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>
          {recipient.profile.firstName} {recipient.profile.lastName}
        </Text>
        <Text style={styles.lastMessage}>{conversation.lastMessageText}</Text>
      </View>
      <Text style={styles.time}>{lastMessageTime}</Text>
      {/* Display the time */}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    alignItems: 'center'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center'
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666'
  },
  time: {
    fontSize: 12,
    color: '#999',
    marginLeft: 10
  }
})
