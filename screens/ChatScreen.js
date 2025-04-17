import React, { useEffect, useState, useRef } from 'react'
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
  SafeAreaView,
  Keyboard,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Image,
  Modal
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { io } from 'socket.io-client'
import MessageItem from '../components/MessageItem'
import config from '../config'
import * as ImagePicker from 'expo-image-picker'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import { Ionicons } from '@expo/vector-icons'

export default function ChatScreen({ route, navigation }) {
  const { conversationId, recipientName } = route.params
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState('')
  const [newMessage, setNewMessage] = useState('')
  const [socket, setSocket] = useState(null)
  const flatListRef = useRef(null)
  const [sending, setSending] = useState(false)
  const [mediaPickerVisible, setMediaPickerVisible] = useState(false)
  const [selectedMedia, setSelectedMedia] = useState(null)
  const [mediaPreviewVisible, setMediaPreviewVisible] = useState(false)

  useEffect(() => {
    const initializeSocket = async () => {
      const token = await AsyncStorage.getItem('token')
      const user = JSON.parse(await AsyncStorage.getItem('user'))
      setUserId(user.id)

      // Connect to the Socket.IO server
      const newSocket = io(`${config.BASE_URL}`, {
        auth: { userId: user.id } // Pass userId for authentication
      })
      setSocket(newSocket)

      // Listen for new messages
      newSocket.on('new_message', (message) => {
        if (message.conversationId === conversationId) {
          setMessages((prevMessages) => {
            const updatedMessages = [message, ...prevMessages]
            // Scroll to bottom on next render
            setTimeout(() => scrollToBottom(), 100)
            return updatedMessages
          })
        }
      })

      return () => {
        newSocket.disconnect() // Disconnect when the component unmounts
      }
    }

    initializeSocket()
    requestPermissions()
  }, [conversationId])

  const requestPermissions = async () => {
    if (Platform.OS !== 'web') {
      const { status: cameraStatus } =
        await ImagePicker.requestCameraPermissionsAsync()
      const { status: libraryStatus } =
        await ImagePicker.requestMediaLibraryPermissionsAsync()

      if (cameraStatus !== 'granted' || libraryStatus !== 'granted') {
        Alert.alert(
          'Permission required',
          'Please grant camera and media library permissions to use this feature'
        )
      }
    }
  }

  useEffect(() => {
    // fetch messages for the selected conversation
    const fetchMessages = async () => {
      try {
        const token = await AsyncStorage.getItem('token')
        const user = JSON.parse(await AsyncStorage.getItem('user'))
        setUserId(user.id)

        const response = await fetch(
          `${config.BASE_URL}/api/conversations/${conversationId}/messages?limit=30`,
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
          // Scroll to bottom after messages load
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

  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToIndex({ index: 0, animated: true })
    }
  }

  const handleSendMessage = async () => {
    if ((!newMessage.trim() && !selectedMedia) || sending) return

    setSending(true)

    try {
      const token = await AsyncStorage.getItem('token')

      let messageObject = {
        conversationId,
        content: newMessage.trim(),
        type: 'TEXT'
      }

      // If media is selected, upload it first
      if (selectedMedia) {
        const formData = new FormData()
        formData.append('file', {
          uri: selectedMedia.uri,
          name:
            selectedMedia.fileName ||
            `${Date.now()}.${selectedMedia.uri.split('.').pop()}`,
          type: selectedMedia.mimeType || 'application/octet-stream'
        })

        // Upload the file
        const uploadResponse = await fetch(`${config.BASE_URL}/api/upload`, {
          method: 'POST',
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${token}`
          },
          body: formData
        })

        const uploadResult = await uploadResponse.json()

        if (!uploadResponse.ok) {
          throw new Error(uploadResult.error || 'Failed to upload file')
        }

        // Update message object with file info
        messageObject = {
          ...messageObject,
          fileUrl: uploadResult.fileUrl,
          fileName: selectedMedia.fileName || 'File',
          fileType: selectedMedia.mimeType,
          fileSize: selectedMedia.fileSize,
          type: selectedMedia.type // 'IMAGE', 'VIDEO', or 'FILE'
        }
      }

      // Send message via socket
      socket.emit('send_message', messageObject)

      // Add the message to the local state
      setMessages((prevMessages) => {
        const updatedMessages = [
          {
            ...messageObject,
            senderId: userId,
            messageId: Date.now().toString(),
            createdAt: new Date().toISOString()
          },
          ...prevMessages
        ]
        // Scroll to bottom on next render after updating messages
        setTimeout(() => scrollToBottom(), 100)
        return updatedMessages
      })

      // Clear inputs
      setNewMessage('')
      setSelectedMedia(null)
      setMediaPreviewVisible(false)
    } catch (error) {
      Alert.alert('Error', error.message || 'Failed to send message')
    } finally {
      setSending(false)
    }
  }

  const pickImage = async (useCamera = false) => {
    try {
      let result

      if (useCamera) {
        result = await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.7,
          allowsEditing: true
        })
      } else {
        result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.All,
          quality: 0.7,
          allowsEditing: true
        })
      }

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0]

        // Fetch file info
        const fileInfo = await FileSystem.getInfoAsync(asset.uri)

        // Check file size (e.g., limit to 10MB)
        const maxFileSize = 10 * 1024 * 1024 // 10MB
        if (fileInfo.size > maxFileSize) {
          Alert.alert(
            'Error',
            'The selected file is too large. Please choose a smaller file.'
          )
          return
        }

        // Update state
        setSelectedMedia({
          uri: asset.uri,
          fileName:
            asset.fileName ||
            `image-${Date.now()}.${asset.uri.split('.').pop()}`,
          mimeType: asset.mimeType,
          type: asset.type === 'video' ? 'VIDEO' : 'IMAGE',
          fileSize: fileInfo.size
        })

        setMediaPreviewVisible(true)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image or video')
    } finally {
      // Close the media picker modal
      setMediaPickerVisible(false)
    }
  }

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true
      })

      if (result.type === 'success') {
        // Check file size (e.g., limit to 10MB)
        const maxFileSize = 10 * 1024 * 1024 // 10MB
        if (result.size > maxFileSize) {
          Alert.alert(
            'Error',
            'The selected file is too large. Please choose a smaller file.'
          )
          return
        }

        // Update state
        setSelectedMedia({
          uri: result.uri,
          fileName: result.name,
          mimeType: result.mimeType,
          type: 'FILE',
          fileSize: result.size
        })

        setMediaPreviewVisible(true)
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to pick document')
    } finally {
      // Close the media picker modal
      setMediaPickerVisible(false)
    }
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.chatContainer}>
            <View style={styles.messageSection}>
              <FlatList
                ref={flatListRef}
                data={messages}
                keyExtractor={(item) => item.messageId}
                renderItem={({ item }) => (
                  <MessageItem
                    message={item}
                    isOwnMessage={item.senderId === userId}
                  />
                )}
                inverted={true}
                style={{ flex: 1 }}
                contentContainerStyle={styles.messageList}
                onContentSizeChange={scrollToBottom}
                onLayout={scrollToBottom}
              />
            </View>

            {/* Media Preview */}
            {selectedMedia && mediaPreviewVisible && (
              <View style={styles.mediaPreviewContainer}>
                {selectedMedia.type === 'IMAGE' && (
                  <Image
                    source={{ uri: selectedMedia.uri }}
                    style={styles.mediaPreview}
                  />
                )}
                {selectedMedia.type === 'VIDEO' && (
                  <View style={styles.mediaPreview}>
                    <Text style={styles.mediaLabel}>Video Selected</Text>
                    <Text style={styles.mediaName}>
                      {selectedMedia.fileName}
                    </Text>
                  </View>
                )}
                {selectedMedia.type === 'FILE' && (
                  <View style={styles.mediaPreview}>
                    <Text style={styles.mediaLabel}>File Selected</Text>
                    <Text style={styles.mediaName}>
                      {selectedMedia.fileName}
                    </Text>
                  </View>
                )}
                <TouchableOpacity
                  style={styles.removeMediaButton}
                  onPress={() => {
                    setSelectedMedia(null)
                    setMediaPreviewVisible(false)
                  }}>
                  <Text style={styles.removeMediaText}>✕</Text>
                </TouchableOpacity>
              </View>
            )}

            <View style={styles.inputContainer}>
              <TouchableOpacity
                style={styles.attachButton}
                onPress={() => setMediaPickerVisible(true)}>
                <Ionicons name="attach" size={24} color="#007bff" />
              </TouchableOpacity>

              <TextInput
                style={styles.input}
                placeholder="Type a message..."
                value={newMessage}
                onChangeText={setNewMessage}
                multiline={true}
                maxHeight={100}
              />

              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !newMessage.trim() && !selectedMedia
                    ? styles.sendButtonDisabled
                    : null
                ]}
                onPress={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedMedia) || sending}>
                {sending ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Ionicons name="send" size={20} color="#ffffff" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>

      {/* Media Picker Modal */}
      <Modal
        visible={mediaPickerVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setMediaPickerVisible(false)}>
        <TouchableWithoutFeedback onPress={() => setMediaPickerVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.mediaPickerContainer}>
              <TouchableOpacity
                style={styles.mediaPickerOption}
                onPress={() => pickImage(false)}>
                <Ionicons name="images" size={24} color="#007bff" />
                <Text style={styles.mediaPickerText}>Photo Library</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaPickerOption}
                onPress={() => pickImage(true)}>
                <Ionicons name="camera" size={24} color="#007bff" />
                <Text style={styles.mediaPickerText}>Take Photo/Video</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.mediaPickerOption}
                onPress={pickDocument}>
                <Ionicons name="document" size={24} color="#007bff" />
                <Text style={styles.mediaPickerText}>Document</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.mediaPickerOption, styles.cancelButton]}
                onPress={() => setMediaPickerVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
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
  messageSection: {
    flex: 1,
    overflow: 'hidden'
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
  attachButton: {
    marginRight: 10,
    padding: 5
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
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center'
  },
  sendButtonDisabled: {
    backgroundColor: '#cccccc'
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)'
  },
  mediaPickerContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20
  },
  mediaPickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  mediaPickerText: {
    fontSize: 16,
    marginLeft: 15
  },
  cancelButton: {
    justifyContent: 'center',
    borderBottomWidth: 0,
    marginTop: 10
  },
  cancelText: {
    fontSize: 16,
    color: '#ff3b30',
    fontWeight: 'bold',
    textAlign: 'center'
  },
  mediaPreviewContainer: {
    height: 70,
    backgroundColor: '#f0f0f0',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    position: 'relative'
  },
  mediaPreview: {
    width: 60,
    height: 60,
    backgroundColor: '#e0e0e0',
    borderRadius: 5,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden'
  },
  mediaLabel: {
    fontSize: 12,
    fontWeight: 'bold'
  },
  mediaName: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    marginTop: 5,
    paddingHorizontal: 5
  },
  removeMediaButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 15,
    width: 25,
    height: 25,
    justifyContent: 'center',
    alignItems: 'center'
  },
  removeMediaText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold'
  }
})
