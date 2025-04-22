import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect
} from 'react'
import io from 'socket.io-client'
import config from '../config'
import { useAuth } from './AuthContext' // Import the custom hook

export const SocketContext = createContext()

export const SocketProvider = ({ children }) => {
  const socketRef = useRef(null)
  const { token, isAuthenticated } = useAuth() // Use the custom hook
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    console.log(`Auth status: ${isAuthenticated}, Token exists: ${!!token}`)

    // Clean up previous socket if it exists
    if (socketRef.current) {
      console.log('Cleaning up previous socket connection')
      socketRef.current.disconnect()
      socketRef.current = null
    }

    // Only create socket if authenticated with token
    if (!isAuthenticated || !token) {
      console.log(
        'Not authenticated or missing token, skipping socket connection'
      )
      return
    }

    console.log(`Establishing socket connection with token: ${token}`)

    // Initialize Socket.io connection
    socketRef.current = io(config.SOCKET_SERVER_URL, {
      transports: ['websocket'],
      auth: {
        token // Send the JWT token for authentication
      }
    })

    // Add event listeners
    socketRef.current.on('connect', () => {
      console.log('Socket connected successfully')
      setIsConnected(true)
    })

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message)
      setIsConnected(false)
    })

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected')
      setIsConnected(false)
    })

    // Cleanup function
    return () => {
      if (socketRef.current) {
        console.log('Disconnecting socket on cleanup')
        socketRef.current.disconnect()
      }
    }
  }, [isAuthenticated, token]) // Depend on auth state changes

  // Provide the socket reference and helper functions
  const socketValue = {
    socket: socketRef.current,
    isConnected
  }

  return (
    <SocketContext.Provider value={socketValue}>
      {children}
    </SocketContext.Provider>
  )
}

// Custom hook to access the socket instance and functions
export const useSocket = () => {
  const context = useContext(SocketContext)
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider')
  }
  return context
}
