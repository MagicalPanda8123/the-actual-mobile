import React, { useLayoutEffect } from 'react'
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Ionicons } from '@expo/vector-icons' // Ensure you have @expo/vector-icons installed

export default function FriendsScreen({ navigation }) {
  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() => {
            // Navigate to the "Find Contact" screen or perform an action
            navigation.navigate('SearchUser') // Replace with your desired screen
          }}
          style={{ marginRight: 15 }}>
          <Ionicons name="add" size={24} color="black" />
        </TouchableOpacity>
      )
    })
  }, [navigation])

  return (
    <View style={styles.container}>
      <Text>Friends Screen</Text>
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
