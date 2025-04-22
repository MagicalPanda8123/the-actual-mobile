import React from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'
import { useAuth } from '../context/AuthContext'

export default function SettingsScreen() {
  const { logout } = useAuth()

  return (
    <View style={styles.container}>
      <Text>Settings Screen</Text>
      <Button title="Logout" onPress={logout} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }
})
