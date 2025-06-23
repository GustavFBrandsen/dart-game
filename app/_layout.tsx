import { Stack } from "expo-router";

export default function RootLayout() {
  return <Stack 
    screenOptions={{
      headerTitleStyle: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
      }
    }}
  >
    <Stack.Screen name="index" options={{ title: 'Create Game' }} />
    <Stack.Screen name="game" options={{ title: 'Game' }} />
    {/* <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    <Stack.Screen name="players" options={{ title: 'Players' }} />
    <Stack.Screen name="rules" options={{ title: 'Rules' }} /> */}
  </Stack>
}
