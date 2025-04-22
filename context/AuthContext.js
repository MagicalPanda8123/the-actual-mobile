import React, { createContext, useState, useEffect, useContext } from 'react'
import * as SecureStore from 'expo-secure-store'

export const AuthContext = createContext()

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(null) // Store the JWT in memory
  const [user, setUser] = useState(null) // Store user information in memory
  const [isAuthenticated, setIsAuthenticated] = useState(false) // Authentication state

  // Load the token and user from secure storage when the app starts
  useEffect(() => {
    const loadSession = async () => {
      const storedToken = await SecureStore.getItemAsync('jwt')
      const storedUser = await SecureStore.getItemAsync('user')

      if (storedToken && storedUser) {
        setToken(storedToken)
        setUser(JSON.parse(storedUser)) // Parse the stored user JSON
        setIsAuthenticated(true)
      }
    }

    loadSession()
  }, [])

  // Login function to store the token and user in memory and secure storage
  const login = async (data) => {
    const { token, user } = data

    // Store in memory
    setToken(token)
    setUser(user)
    setIsAuthenticated(true)

    // Store the JWT and user in secure storage
    await SecureStore.setItemAsync('jwt', token)
    await SecureStore.setItemAsync('user', JSON.stringify(user)) // Store user as a JSON string
  }

  // Logout function to clear the token and user from memory and secure storage
  const logout = async () => {
    // Clear from memory
    setToken(null)
    setUser(null)
    setIsAuthenticated(false)

    // Clear the JWT and user from secure storage
    await SecureStore.deleteItemAsync('jwt')
    await SecureStore.deleteItemAsync('user')
  }

  return <AuthContext.Provider value={{ token, user, isAuthenticated, login, logout }}>{children}</AuthContext.Provider>
}

export const useAuth = () => useContext(AuthContext)
