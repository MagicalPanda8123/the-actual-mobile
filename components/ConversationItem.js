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

export default function ConversationItem({ conversation, onPress }) {
  const { name, avatar, lastMessageText, lastMessageAt } = conversation
  const lastMessageTime = formatTime(lastMessageAt) // Format the last message time

  return (
    <TouchableOpacity onPress={onPress} style={styles.container}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.lastMessage}>{lastMessageText}</Text>
      </View>
      <Text style={styles.time}>{lastMessageTime}</Text>
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
