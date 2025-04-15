import React from 'react'
import { View, Text, Button, StyleSheet } from 'react-native'

export default function RegisterScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text>Register Screen</Text>
      <Button
        title="Go to Login"
        onPress={() => navigation.navigate('Login')}
      />
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
