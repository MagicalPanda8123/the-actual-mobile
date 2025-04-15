import React, { useState } from 'react'
import { View, Text, TextInput, Button, Alert, StyleSheet } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage' // Import AsyncStorage
import { useAuth } from '../AuthContext'
import config from '../config'

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${config.BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      })

      const result = await response.json()

      if (response.ok) {
        // Successful login
        const { token, user } = result.data

        // Store token and user in AsyncStorage
        await AsyncStorage.setItem('token', token)
        await AsyncStorage.setItem('user', JSON.stringify(user))

        login() // Update authentication state
        Alert.alert('Success', result.message)
      } else {
        // Failed login
        Alert.alert('Error', result.error)
      }
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again later.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Login</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button
        title={loading ? 'Logging in...' : 'Login'}
        onPress={handleLogin}
        disabled={loading}
      />
      <Button
        title="Go to Register"
        onPress={() => navigation.navigate('Register')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 15,
    borderRadius: 5
  }
})
