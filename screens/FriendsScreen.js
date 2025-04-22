import React, { useEffect, useState, useLayoutEffect } from 'react'
import { View, Text, StyleSheet, FlatList, Image, ActivityIndicator, TouchableOpacity, TextInput, Pressable } from 'react-native'
import { Ionicons } from '@expo/vector-icons' // Ensure you have @expo/vector-icons installed
import config from '../config'
import { useAuth } from '../context/AuthContext' // Import your auth context
import defaultAvatar from '../assets/avatar.png' // Import the default avatar

export default function FriendsScreen({ navigation }) {
  const { token } = useAuth() // Retrieve the token from the auth context
  const [activeTab, setActiveTab] = useState('Friends') // Tabs: Friends, Sent, Received
  const [friends, setFriends] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [receivedRequests, setReceivedRequests] = useState([])
  const [filteredFriends, setFilteredFriends] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    // Fetch data based on the active tab
    const fetchData = async () => {
      setLoading(true)
      try {
        if (activeTab === 'Friends') {
          const response = await fetch(`${config.BASE_URL}/api/friendships/`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const result = await response.json()
          if (response.ok) {
            setFriends(result.friends)
            setFilteredFriends(result.friends)
          }
        } else if (activeTab === 'Sent') {
          const response = await fetch(`${config.BASE_URL}/api/friendships/sent`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const result = await response.json()
          if (response.ok) {
            setSentRequests(result.requests) // Corrected key
          }
        } else if (activeTab === 'Received') {
          const response = await fetch(`${config.BASE_URL}/api/friendships/received`, {
            headers: { Authorization: `Bearer ${token}` }
          })
          const result = await response.json()
          if (response.ok) {
            setReceivedRequests(result.requests) // Corrected key
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [activeTab, token])

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            // Navigate to the "SearchUser" screen
            navigation.navigate('SearchUser')
          }}
          style={{ marginRight: 15 }}>
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      )
    })
  }, [navigation])

  const handleSearch = (query) => {
    setSearchQuery(query)
    if (query.trim() === '') {
      setFilteredFriends(friends) // Reset to full list if search is empty
    } else {
      const filtered = friends.filter((friend) => `${friend.profile.firstName} ${friend.profile.lastName}`.toLowerCase().includes(query.toLowerCase()))
      setFilteredFriends(filtered)
    }
  }

  const renderFriend = ({ item }) => {
    const avatarUrl = item.profile.avatar ? { uri: item.profile.avatar } : defaultAvatar // Use default avatar if none is provided
    const fullName = `${item.profile.firstName} ${item.profile.lastName}`

    const handleUnfriend = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/${item.userId}/unfriend`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // Remove the unfriended user from the list
          setFriends((prev) => prev.filter((friend) => friend.userId !== item.userId))
          setFilteredFriends((prev) => prev.filter((friend) => friend.userId !== item.userId))
          console.log('Unfriended successfully')
        } else {
          console.error('Failed to unfriend')
        }
      } catch (error) {
        console.error('Error unfriending:', error)
      }
    }

    return (
      <View style={styles.friendItem}>
        <Image source={avatarUrl} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.friendName}>{fullName}</Text>
          <Text style={styles.friendPhone}>{item.profile.phone || 'No phone number'}</Text>
        </View>
        <TouchableOpacity style={styles.unfriendButton} onPress={handleUnfriend}>
          <Text style={styles.buttonText}>Unfriend</Text>
        </TouchableOpacity>
      </View>
    )
  }

  const renderRequest = ({ item }) => {
    const avatarUrl = item.profile.avatar ? { uri: item.profile.avatar } : defaultAvatar
    const fullName = `${item.profile.firstName} ${item.profile.lastName}`

    const handleAccept = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/${item.userId}/accept`, {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // Remove the accepted request from the list
          setReceivedRequests((prev) => prev.filter((request) => request.userId !== item.userId))
          console.log('Friend request accepted')
        } else {
          console.error('Failed to accept friend request')
        }
      } catch (error) {
        console.error('Error accepting friend request:', error)
      }
    }

    const handleReject = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/${item.userId}/reject`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // Remove the rejected request from the list
          setReceivedRequests((prev) => prev.filter((request) => request.userId !== item.userId))
          console.log('Friend request rejected')
        } else {
          console.error('Failed to reject friend request')
        }
      } catch (error) {
        console.error('Error rejecting friend request:', error)
      }
    }

    return (
      <View style={styles.friendItem}>
        <Image source={avatarUrl} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.friendName}>{fullName}</Text>
        </View>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.acceptButton} onPress={handleAccept}>
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.rejectButton} onPress={handleReject}>
            <Text style={styles.buttonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  const renderSentRequest = ({ item }) => {
    const avatarUrl = item.profile.avatar ? { uri: item.profile.avatar } : defaultAvatar
    const fullName = `${item.profile.firstName} ${item.profile.lastName}`

    const handleCancelRequest = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/${item.userId}/cancel`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.ok) {
          // Remove the canceled request from the sentRequests list
          setSentRequests((prev) => prev.filter((request) => request.userId !== item.userId))
          console.log('Friend request canceled')
        } else {
          console.error('Failed to cancel friend request')
        }
      } catch (error) {
        console.error('Error canceling friend request:', error)
      }
    }

    return (
      <View style={styles.friendItem}>
        <Image source={avatarUrl} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={styles.friendName}>{fullName}</Text>
        </View>
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancelRequest}>
          <Text style={styles.buttonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        {['Friends', 'Sent', 'Received'].map((tab) => (
          <Pressable key={tab} style={[styles.tab, activeTab === tab && styles.activeTab]} onPress={() => setActiveTab(tab)}>
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>{tab}</Text>
          </Pressable>
        ))}
      </View>

      {/* Search Bar */}
      {activeTab === 'Friends' && (
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
          <TextInput style={styles.searchInput} placeholder="Search friends..." value={searchQuery} onChangeText={handleSearch} />
        </View>
      )}

      {/* List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <FlatList
          data={activeTab === 'Friends' ? filteredFriends : activeTab === 'Sent' ? sentRequests : receivedRequests}
          keyExtractor={(item) => item.userId}
          renderItem={activeTab === 'Friends' ? renderFriend : activeTab === 'Sent' ? renderSentRequest : renderRequest}
          contentContainerStyle={styles.listContainer}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9'
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#fff',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20
  },
  activeTab: {
    backgroundColor: '#007bff'
  },
  tabText: {
    fontSize: 16,
    color: '#555'
  },
  activeTabText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  searchIcon: {
    marginRight: 8
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333'
  },
  listContainer: {
    paddingHorizontal: 16
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 16
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  friendPhone: {
    fontSize: 14,
    color: '#666'
  },
  actionButtons: {
    flexDirection: 'row'
  },
  acceptButton: {
    backgroundColor: '#4CAF50',
    padding: 8,
    borderRadius: 5,
    marginRight: 8
  },
  rejectButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  },
  unfriendButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5
  },
  cancelButton: {
    backgroundColor: '#F44336',
    padding: 8,
    borderRadius: 5
  }
})
