import React from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createStackNavigator } from '@react-navigation/stack'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { AuthProvider, useAuth } from './AuthContext'
import LoginScreen from './screens/LoginScreen'
import RegisterScreen from './screens/RegisterScreen'
import ConversationsScreen from './screens/ConversationsScreen'
import FriendsScreen from './screens/FriendsScreen'
import ChatScreen from './screens/ChatScreen'
import SettingsScreen from './screens/SettingsScreen'
import SearchUserScreen from './screens/SearchUserScreen'
import Ionicons from '@expo/vector-icons/Ionicons' // Import Ionicons for tab icons

const Stack = createStackNavigator()
const Tab = createBottomTabNavigator()

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

          // Return the icon component
          return <Ionicons name={iconName} size={size} color={color} />
        },
        tabBarActiveTintColor: '#007BFF', // Active tab color
        tabBarInactiveTintColor: 'gray', // Inactive tab color
        tabBarStyle: {
          backgroundColor: '#f9f9f9', // Background color for the tab bar
          borderTopWidth: 1,
          borderTopColor: '#ccc',
          height: 70, // Adjust the height of the tab bar
          paddingBottom: 10, // Add padding at the bottom for better spacing
          paddingTop: 5 // Add padding at the top for better spacing
        },
        tabBarLabelStyle: {
          fontSize: 12 // Adjust the font size of the labels
        }
      })}>
      <Tab.Screen name="Chats" component={ConversationsScreen} />
      <Tab.Screen
        name="Friends"
        component={FriendsStack}
        options={{ headerShown: false }}
      />
      <Tab.Screen name="Settings" component={SettingsScreen} />
    </Tab.Navigator>
  )
}

function AppNavigator() {
  const { isAuthenticated } = useAuth()

  return (
    <Stack.Navigator>
      {!isAuthenticated ? (
        <>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
        </>
      ) : (
        <>
          <Stack.Screen
            name="Main"
            component={MainTabs}
            options={{ headerShown: false }}
          />
          <Stack.Screen name="Chat" component={ChatScreen} />
        </>
      )}
    </Stack.Navigator>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <NavigationContainer>
        <AppNavigator />
      </NavigationContainer>
    </AuthProvider>
  )
}
