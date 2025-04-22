import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider, useAuth } from './context/AuthContext'
import { SocketProvider } from './context/SocketContext'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ConversationsScreen from './screens/ConversationsScreen'
import FriendsScreen from './screens/FriendsScreen'
import ChatScreen from './screens/ChatScreen'
import SettingsScreen from './screens/SettingsScreen'
import SearchUserScreen from './screens/SearchUserScreen'
import GroupCreationScreen from './screens/GroupCreationScreen'
import Ionicons from '@expo/vector-icons/Ionicons'
import { TouchableOpacity, Text } from 'react-native'

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

// Chats Stack: ConversationsScreen and ChatScreen
function ChatsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="Conversations"
        component={ConversationsScreen}
        options={({ navigation }) => ({
          headerTitle: 'Chats',
          headerRight: () => (
            <TouchableOpacity
              onPress={() => navigation.navigate('GroupCreation')}
              style={{ marginRight: 15 }}>
              <Text style={{ fontSize: 18, color: '#007bff' }}>
                Create group
              </Text>
            </TouchableOpacity>
          )
        })}
      />
      <Stack.Screen
        name="Chat"
        component={ChatScreen}
        options={({ route }) => ({
          headerTitle: route.params?.recipientName || 'Chat'
        })}
      />
      <Stack.Screen
        name="GroupCreation"
        component={GroupCreationScreen}
        options={{ headerTitle: 'Create Group' }}
      />
    </Stack.Navigator>
  )
}

// Friends Stack: FriendsScreen and SearchUserScreen
function FriendsStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="FriendsHome"
        component={FriendsScreen}
        options={{ headerTitle: 'Friends' }}
      />
      <Stack.Screen
        name="SearchUser"
        component={SearchUserScreen}
        options={{ headerTitle: 'Search User' }}
      />
    </Stack.Navigator>
  )
}

// Main Tabs: ChatsStack, FriendsStack, and SettingsScreen
function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName

          if (route.name === 'Chats') {
            iconName = focused ? 'chatbubble' : 'chatbubble-outline'
          } else if (route.name === 'Friends') {
            iconName = focused ? 'people' : 'people-outline'
          } else if (route.name === 'Settings') {
            iconName = focused ? 'settings' : 'settings-outline'
          }

          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#007BFF',
        tabBarInactiveTintColor: 'gray',
        tabBarStyle: {
          backgroundColor: '#f9f9f9',
          borderTopWidth: 1,
          borderTopColor: '#ccc',
          height: 100,
          paddingBottom: 10,
          paddingTop: 5
        },
        tabBarLabelStyle: {
          fontSize: 12
        }
      })}>
      <Tab.Screen name="Chats" component={ChatsStack} />
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

// Authentication Stack: LoginScreen and RegisterScreen
function AuthStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  )
}

// App Navigator: Toggle between AuthStack and MainTabs
function AppNavigator() {
  const { isAuthenticated } = useAuth()

  if (!isAuthenticated) {
    return <AuthStack />
  }

  return <MainTabs />
}

// Root App Component
export default function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </SocketProvider>
    </AuthProvider>
  )
}
