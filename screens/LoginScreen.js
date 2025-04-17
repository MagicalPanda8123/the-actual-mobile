/*
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
})*/

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  StyleSheet,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
  StatusBar
} from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import { useAuth } from '../AuthContext'
import config from '../config'
import { Ionicons } from '@expo/vector-icons' // Đảm bảo đã cài đặt expo/vector-icons

export default function LoginScreen({ navigation }) {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!email || !password) {
      Alert.alert('Lỗi', 'Vui lòng nhập email và mật khẩu')
      return
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Địa chỉ email không hợp lệ')
      return
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`${config.BASE_URL}/api/auth/login`, {
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
        await AsyncStorage.setItem('token', token)
        await AsyncStorage.setItem('user', JSON.stringify(user))
        login() // Update authentication state
        Alert.alert('Thành công', result.message)
      } else {
        // Failed login
        Alert.alert('Lỗi', result.error)
      }
    } catch (error) {
      Alert.alert('Lỗi', 'Đã xảy ra lỗi. Vui lòng thử lại sau.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>
        <View style={styles.logoContainer}>
          <Image
            // source={require('../assets/logo.png')} // Thêm logo của bạn vào thư mục assets
            style={styles.logo}
            resizeMode="contain"
          />
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.brandMain}>MiuMiu</Text>
            <Text style={styles.brandSub}>chat app</Text>
          </View>
        </View>

        <View style={styles.formContainer}>
          <Text style={styles.title}>Đăng nhập</Text>
          <Text style={styles.subtitle}>Chào mừng bạn trở lại!</Text>

          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Email"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={24}
              color="#666"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Mật khẩu"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword(!showPassword)}
              style={styles.eyeIcon}>
              <Ionicons
                name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.forgotPassword}>
            <Text style={styles.forgotPasswordText}>Quên mật khẩu?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={handleLogin}
            disabled={loading}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.loginButtonText}>Đăng Nhập</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Chưa có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerText}>Đăng ký ngay</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  brandMain: {
    fontSize: 40,
    fontWeight: 'bold',
    color: '#512DA8',
    marginTop: 10
  },
  brandSub: {
    fontSize: 30,
    color: '#666',
    marginTop: -4
  },

  safeArea: {
    flex: 1,
    backgroundColor: '#fff'
  },
  container: {
    flex: 1,
    justifyContent: 'space-between',
    padding: 20
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 40
  },
  logo: {
    width: 120,
    height: 120
  },
  appName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#512DA8',
    marginTop: 10
  },
  formContainer: {
    width: '100%'
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    height: 55,
    backgroundColor: '#f9f9f9'
  },
  inputIcon: {
    marginRight: 10
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    height: '100%'
  },
  eyeIcon: {
    padding: 5
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20
  },
  forgotPasswordText: {
    color: '#512DA8',
    fontSize: 14,
    fontWeight: '600'
  },
  loginButton: {
    backgroundColor: '#512DA8',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#512DA8',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 3
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold'
  },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 30
  },
  separatorLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#ddd'
  },
  separatorText: {
    color: '#888',
    paddingHorizontal: 10,
    fontSize: 16
  },
  socialLogin: {
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 12,
    padding: 12,
    width: '48%'
  },
  socialButtonText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#333'
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20
  },
  footerText: {
    color: '#666',
    fontSize: 16
  },
  registerText: {
    color: '#512DA8',
    fontWeight: 'bold',
    fontSize: 16
  }
})
