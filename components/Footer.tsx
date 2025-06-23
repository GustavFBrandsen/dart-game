import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, TouchableOpacity, View } from 'react-native';

export default function Footer() {
  const router = useRouter();

  return (
    <View style={styles.footer}>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/overview')}>
        <Ionicons name="list-circle-outline" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/')}>
        <Ionicons name="home" size={32} color="white" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.link} onPress={() => router.push('/settings')}>
        <Ionicons name="settings-outline" size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  footer: {
    width: '100%',
    paddingVertical: 12,
    backgroundColor: '#222',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    position: 'absolute',
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  link: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
});