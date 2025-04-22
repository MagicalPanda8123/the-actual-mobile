import React, { useEffect, useState, useContext, useRef } from 'react'
import {
  View,
  Text,
  Image,
  Switch,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SectionList,
  Modal,
  FlatList,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback
} from 'react-native'
import config from '../config'
import { useAuth } from '../context/AuthContext'
import { SocketContext, useSocket } from '../context/SocketContext' // Import SocketContext and useSocket
import MessageItem from '../components/MessageItem' // Import the MessageItem component

export default function ConversationInfoScreen({ route, navigation }) {
  const { conversationId, currentlyOpenedConversationId } = route.params
  const { token, user } = useAuth()
  const { socket, isConnected } = useSocket() // Use the single socket connection from SocketContext
  const [isMuted, setIsMuted] = useState(false)
  const [conversationDetails, setConversationDetails] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showAdminSelectionModal, setShowAdminSelectionModal] = useState(false)
  const [selectedAdmins, setSelectedAdmins] = useState([])
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState('')
  const flatListRef = useRef(null)
  const [sending, setSending] = useState(false)

  const handleToggleMute = () => setIsMuted((prev) => !prev)

  useEffect(() => {
    const fetchConversationDetails = async () => {
      try {
        if (!token) {
          Alert.alert('Error', 'Authentication token is missing.')
          return
        }

        const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (response.ok) {
          setConversationDetails(result)
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch conversation details.')
        }
      } catch (error) {
        console.error('Error fetching conversation details:', error)
        Alert.alert('Error', 'Something went wrong. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchConversationDetails()
  }, [conversationId, token])

  useEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity onPress={() => navigation.navigate('InviteFriend', { conversationId })} style={{ marginRight: 15 }}>
          <Text style={{ fontSize: 18, color: '#007bff' }}>Invite</Text>
        </TouchableOpacity>
      )
    })
  }, [navigation, conversationId])

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
    // Avoid duplicate messages by checking messageId
    setMessages((prevMessages) => {
      if (prevMessages.some((msg) => msg.messageId === message.messageId)) {
        return prevMessages
      }
      return [message, ...prevMessages]
    })

    // Scroll to the bottom on the next render
    setTimeout(() => scrollToBottom(), 100)
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
      type: 'TEXT',
      senderId: user.id, // Include the senderId
      profile: {
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar || null
      }
    }

    // Emit "send-message" event to the server
    if (socket && isConnected) {
      socket.emit('send-message', messageObject)
    }

    // Add the message to the local state
    setMessages((prevMessages) => [
      {
        ...messageObject,
        messageId: Date.now().toString(), // Temporary ID
        createdAt: new Date().toISOString()
      },
      ...prevMessages
    ])

    // Clear the input field
    setNewMessage('')
    setTimeout(() => scrollToBottom(), 100)
    setSending(false)
  }

  const handleApproveUser = async (userId) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ approvedUserId: userId })
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'User approved successfully.')
        setConversationDetails((prev) => ({
          ...prev,
          pendingParticipants: prev.pendingParticipants.filter((user) => user.userId !== userId)
        }))
      } else {
        Alert.alert('Error', result.message || 'Failed to approve user.')
      }
    } catch (error) {
      console.error('Error approving user:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const handleRejectUser = async (userId) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ rejectedUserId: userId })
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'User rejected successfully.')
        setConversationDetails((prev) => ({
          ...prev,
          pendingParticipants: prev.pendingParticipants.filter((user) => user.userId !== userId)
        }))
      } else {
        Alert.alert('Error', result.message || 'Failed to reject user.')
      }
    } catch (error) {
      console.error('Error rejecting user:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const handleRemoveUser = async (userId) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/members/${userId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        }
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'User removed successfully.')
        setConversationDetails((prev) => ({
          ...prev,
          participants: prev.participants.filter((user) => user.userId !== userId)
        }))
      } else {
        Alert.alert('Error', result.message || 'Failed to remove user.')
      }
    } catch (error) {
      console.error('Error removing user:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const handlePromoteUser = (userId) => handleUpdateUserRole(userId, true)
  const handleDemoteUser = (userId) => handleUpdateUserRole(userId, false)

  const handleUpdateUserRole = async (userId, isAdmin) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/members/${userId}/role`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isAdmin })
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', isAdmin ? 'User promoted to admin.' : 'User demoted from admin.')
        setConversationDetails((prev) => ({
          ...prev,
          participants: prev.participants.map((user) => (user.userId === userId ? { ...user, isAdmin } : user))
        }))
      } else {
        Alert.alert('Error', result.message || `Failed to ${isAdmin ? 'promote' : 'demote'} user.`)
      }
    } catch (error) {
      console.error(`Error ${isAdmin ? 'promoting' : 'demoting'} user:`, error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const renderAdminSelectionModal = () => (
    <Modal visible={showAdminSelectionModal} animationType="slide" transparent={true}>
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>Select New Admins</Text>
          <FlatList
            data={conversationDetails.participants.filter((participant) => participant.userId !== user.id)}
            keyExtractor={(item) => item.userId}
            renderItem={({ item }) => (
              <View style={styles.adminRow}>
                <Text style={styles.adminName}>
                  {item.profile.firstName} {item.profile.lastName}
                </Text>
                <Switch
                  value={selectedAdmins.includes(item.userId)}
                  onValueChange={(checked) => {
                    if (checked) {
                      setSelectedAdmins((prev) => [...prev, item.userId])
                    } else {
                      setSelectedAdmins((prev) => prev.filter((id) => id !== item.userId))
                    }
                  }}
                />
              </View>
            )}
          />
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => {
              if (selectedAdmins.length === 0) {
                Alert.alert('Error', 'Please select at least one admin.')
                return
              }
              setShowAdminSelectionModal(false)
              leaveGroup(selectedAdmins)
            }}>
            <Text style={styles.buttonText}>Confirm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    )
  }

  if (!conversationDetails) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Failed to load conversation details.</Text>
      </View>
    )
  }

  const isAdminOrCreator = conversationDetails.participants.some(
    (participant) => participant.userId === user.id && (participant.isAdmin || participant.isCreator)
  )

  const renderSectionHeader = ({ section: { title } }) => <Text style={styles.sectionTitle}>{title}</Text>

  const renderParticipant = ({ item }) => {
    const isCurrentUserAdmin = conversationDetails.participants.some(
      (participant) => participant.userId === user.id && (participant.isAdmin || participant.isCreator)
    )

    return (
      <View style={styles.participantRow}>
        <Image source={{ uri: item.profile.avatar || require('../assets/avatar.png') }} style={styles.avatar} />
        <View style={styles.participantInfo}>
          <Text style={styles.participantName}>
            {item.profile.firstName} {item.profile.lastName}
          </Text>
          {item.isAdmin && <Text style={styles.adminBadge}>Admin</Text>}
          {item.isCreator && <Text style={styles.creatorBadge}>Creator</Text>}
        </View>
        {isCurrentUserAdmin && !item.isCreator && (
          <View style={styles.actions}>
            {item.isAdmin ? (
              <TouchableOpacity style={styles.demoteButton} onPress={() => handleDemoteUser(item.userId)}>
                <Text style={styles.buttonText}>Demote</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.promoteButton} onPress={() => handlePromoteUser(item.userId)}>
                <Text style={styles.buttonText}>Promote</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.removeButton} onPress={() => handleRemoveUser(item.userId)}>
              <Text style={styles.buttonText}>Remove</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    )
  }

  const renderPendingUser = ({ item }) => (
    <View style={styles.pendingRow}>
      <Text style={styles.pendingName}>
        {item.profile.firstName} {item.profile.lastName}
      </Text>
      {isAdminOrCreator && (
        <View style={styles.pendingActions}>
          <TouchableOpacity style={styles.approveButton} onPress={() => handleApproveUser(item.userId)}>
            <Text style={styles.buttonText}>Approve</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={() => handleRejectUser(item.userId)}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  )

  const sections = [
    {
      title: `Participants (${conversationDetails.numOfParticipants})`,
      data: conversationDetails.participants,
      renderItem: renderParticipant
    },
    {
      title: `Pending Requests (${conversationDetails.pendingParticipants.length})`,
      data: conversationDetails.pendingParticipants,
      renderItem: renderPendingUser
    }
  ]

  const renderMessageItem = ({ item }) => {
    const isOwnMessage = item.senderId === user.id

    return <MessageItem message={item} isOwnMessage={isOwnMessage} />
  }

  return (
    <SafeAreaView style={styles.container}>
      <SectionList
        sections={sections}
        keyExtractor={(item, index) => index.toString()}
        renderItem={({ item, section }) => section.renderItem({ item })}
        renderSectionHeader={renderSectionHeader}
        contentContainerStyle={styles.sectionListContainer}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  errorText: {
    fontSize: 16,
    color: 'red'
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginVertical: 10
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 10
  },
  participantInfo: {
    flex: 1
  },
  participantName: {
    fontSize: 16
  },
  adminBadge: {
    fontSize: 12,
    color: '#007bff',
    fontWeight: 'bold'
  },
  creatorBadge: {
    fontSize: 12,
    color: '#e53935',
    fontWeight: 'bold'
  },
  actions: {
    flexDirection: 'row'
  },
  promoteButton: {
    backgroundColor: '#4caf50',
    padding: 8,
    borderRadius: 5,
    marginRight: 5
  },
  demoteButton: {
    backgroundColor: '#ff9800',
    padding: 8,
    borderRadius: 5,
    marginRight: 5
  },
  removeButton: {
    backgroundColor: '#e53935',
    padding: 8,
    borderRadius: 5
  },
  pendingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  pendingName: {
    fontSize: 16
  },
  pendingActions: {
    flexDirection: 'row'
  },
  approveButton: {
    backgroundColor: '#4caf50',
    padding: 10,
    borderRadius: 5,
    marginRight: 10
  },
  rejectButton: {
    backgroundColor: '#e53935',
    padding: 10,
    borderRadius: 5
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)'
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center'
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20
  },
  adminRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%'
  },
  adminName: {
    fontSize: 16
  },
  confirmButton: {
    backgroundColor: '#4caf50',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: 'center',
    width: '100%'
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  keyboardAvoidingView: {
    flex: 1
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
  },
  sectionListContainer: {
    paddingBottom: 20
  }
})
