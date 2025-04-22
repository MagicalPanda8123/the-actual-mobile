import React, { useEffect, useState } from 'react'
import { View, Text, FlatList, TouchableOpacity, Alert, StyleSheet, ActivityIndicator } from 'react-native'
import config from '../config'
import { useAuth } from '../context/AuthContext'

export default function InviteFriendScreen({ route }) {
  const { conversationId } = route.params // Get the conversationId from route params
  const { token } = useAuth() // Get the token from AuthContext
  const [friends, setFriends] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const response = await fetch(`${config.BASE_URL}/api/friendships/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          }
        })

        const result = await response.json()

        if (response.ok) {
          setFriends(result.friends || []) // Assuming the API returns a `friends` array
        } else {
          Alert.alert('Error', result.message || 'Failed to fetch friends.')
        }
      } catch (error) {
        console.error('Error fetching friends:', error)
        Alert.alert('Error', 'Something went wrong. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchFriends()
  }, [token])

  const handleInvite = async (userId) => {
    try {
      const response = await fetch(`${config.BASE_URL}/api/conversations/${conversationId}/invite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ invitedUserId: userId })
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Success', 'User invited successfully.')
      } else {
        Alert.alert('Error', result.message || 'Failed to invite user.')
      }
    } catch (error) {
      console.error('Error inviting user:', error)
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    }
  }

  const renderFriend = ({ item }) => (
    <View style={styles.friendRow}>
      <Text style={styles.friendName}>
        {item.profile.firstName} {item.profile.lastName}
      </Text>
      <TouchableOpacity style={styles.inviteButton} onPress={() => handleInvite(item.userId)}>
        <Text style={styles.buttonText}>Invite</Text>
      </TouchableOpacity>
    </View>
  )

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    )
  }

  if (friends.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>You have no friends to invite.</Text>
      </View>
    )
  }

  return <FlatList data={friends} keyExtractor={(item) => item.userId} renderItem={renderFriend} contentContainerStyle={styles.container} />
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#fff'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyText: {
    fontSize: 16,
    color: '#aaa'
  },
  friendRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd'
  },
  friendName: {
    fontSize: 16
  },
  inviteButton: {
    backgroundColor: '#007bff',
    padding: 10,
    borderRadius: 5
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold'
  }
})
