/*
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
})*/

import React, { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar
} from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { useAuth } from '../context/AuthContext'
import config from '../config'

export default function RegisterScreen({ navigation }) {
  const { login } = useAuth()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (
      !firstName ||
      !lastName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      Alert.alert('Lỗi', 'Vui lòng nhập đầy đủ thông tin')
      return
    }

    if (!emailRegex.test(email)) {
      Alert.alert('Lỗi', 'Email không hợp lệ')
      return
    }

    if (password.length < 6) {
      Alert.alert('Lỗi', 'Mật khẩu phải có ít nhất 6 ký tự')
      return
    }

    if (password !== confirmPassword) {
      Alert.alert('Lỗi', 'Mật khẩu không khớp')
      return
    }

    setLoading(true)

    try {
      const response = await fetch(`${config.BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName,
          lastName,
          username,
          email,
          password
        })
      })

      const result = await response.json()

      if (response.ok) {
        Alert.alert('Thành công', 'Đăng ký thành công. Vui lòng đăng nhập')
        navigation.navigate('Login')
      } else {
        Alert.alert('Lỗi', result.error || 'Đăng ký thất bại')
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
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <View style={{ alignItems: 'center', marginBottom: 30 }}>
          <Text style={styles.brandMain}>MiuMiu</Text>
          <Text style={styles.brandSub}>Chat app</Text>
        </View>

        <Text style={styles.title}>Tạo tài khoản</Text>
        <Text style={styles.subtitle}>Vui lòng điền đầy đủ thông tin</Text>

        <InputField
          icon="person-outline"
          placeholder="Họ"
          value={lastName}
          onChange={setLastName}
        />
        <InputField
          icon="person-outline"
          placeholder="Tên"
          value={firstName}
          onChange={setFirstName}
        />
        <InputField
          icon="at-outline"
          placeholder="Tên đăng nhập"
          value={username}
          onChange={setUsername}
        />
        <InputField
          icon="mail-outline"
          placeholder="Email"
          value={email}
          onChange={setEmail}
          keyboardType="email-address"
        />

        <PasswordInput
          placeholder="Mật khẩu"
          value={password}
          onChange={setPassword}
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
        />
        <PasswordInput
          placeholder="Nhập lại mật khẩu"
          value={confirmPassword}
          onChange={setConfirmPassword}
          show={showPassword}
          toggle={() => setShowPassword(!showPassword)}
        />

        <TouchableOpacity
          style={styles.registerButton}
          onPress={handleRegister}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.registerButtonText}>Đăng ký</Text>
          )}
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Đã có tài khoản? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Đăng nhập</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  )
}

// Tách input thành component riêng cho gọn
const InputField = ({
  icon,
  placeholder,
  value,
  onChange,
  keyboardType = 'default'
}) => (
  <View style={styles.inputContainer}>
    <Ionicons name={icon} size={24} color="#666" style={styles.inputIcon} />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      autoCapitalize="none"
    />
  </View>
)

const PasswordInput = ({ placeholder, value, onChange, show, toggle }) => (
  <View style={styles.inputContainer}>
    <Ionicons
      name="lock-closed-outline"
      size={24}
      color="#666"
      style={styles.inputIcon}
    />
    <TextInput
      style={styles.input}
      placeholder={placeholder}
      value={value}
      onChangeText={onChange}
      secureTextEntry={!show}
    />
    <TouchableOpacity onPress={toggle} style={styles.eyeIcon}>
      <Ionicons
        name={show ? 'eye-outline' : 'eye-off-outline'}
        size={24}
        color="#666"
      />
    </TouchableOpacity>
  </View>
)

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#fff' },
  container: { flex: 1, justifyContent: 'center', padding: 20 },
  brandMain: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#512DA8'
  },
  brandSub: {
    fontSize: 20,
    color: '#666'
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#333', marginBottom: 4 },
  subtitle: { fontSize: 16, color: '#666', marginBottom: 20 },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#ddd',
    borderRadius: 12,
    paddingHorizontal: 15,
    marginBottom: 15,
    height: 55,
    backgroundColor: '#f9f9f9'
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333', height: '100%' },
  eyeIcon: { padding: 5 },
  registerButton: {
    backgroundColor: '#512DA8',
    borderRadius: 12,
    height: 55,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10
  },
  registerButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 20 },
  footerText: { color: '#666', fontSize: 16 },
  loginText: { color: '#512DA8', fontWeight: 'bold', fontSize: 16 }
})
