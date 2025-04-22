import React from 'react'
import { View, Text, StyleSheet, Image, TouchableOpacity } from 'react-native'

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
  const { name, avatar, lastMessageText, unread, lastMessageAt } = conversation

  return (
    <TouchableOpacity style={styles.container} onPress={onPress}>
      <Image source={avatar} style={styles.avatar} />
      <View style={styles.textContainer}>
        <Text style={[styles.name, unread && styles.unreadName]}>{name}</Text>
        <Text style={[styles.lastMessage, unread && styles.unreadMessage]}>
          {lastMessageText}
        </Text>
      </View>
      <View style={styles.rightContainer}>
        <Text style={styles.timestamp}>
          {formatTime(lastMessageAt)} {/* Format the timestamp */}
        </Text>
        {unread && <View style={styles.unreadIndicator} />}
      </View>
    </TouchableOpacity>
  )
}

export function MessageItem({ message, isOwnMessage }) {
  return (
    <View
      style={[
        styles.messageContainer,
        isOwnMessage ? styles.ownMessageContainer : styles.otherMessageContainer
      ]}>
      <Text style={styles.messageText}>{message.content}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10
  },
  textContainer: {
    flex: 1
  },
  name: {
    fontSize: 16,
    fontWeight: 'normal',
    color: '#333'
  },
  unreadName: {
    fontWeight: 'bold'
  },
  lastMessage: {
    fontSize: 14,
    color: '#666'
  },
  unreadMessage: {
    fontWeight: 'bold',
    color: '#000'
  },
  rightContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center'
  },
  timestamp: {
    fontSize: 12,
    color: '#999',
    marginBottom: 5
  },
  unreadIndicator: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007BFF',
    marginTop: 5
  },
  messageContainer: {
    marginVertical: 5,
    padding: 10,
    borderRadius: 10,
    maxWidth: '80%'
  },
  ownMessageContainer: {
    alignSelf: 'flex-end',
    backgroundColor: '#007bff',
    borderTopRightRadius: 0
  },
  otherMessageContainer: {
    alignSelf: 'flex-start',
    backgroundColor: '#f1f1f1',
    borderTopLeftRadius: 0
  },
  messageText: {
    color: '#fff'
  },
  otherMessageText: {
    color: '#000'
  }
})
