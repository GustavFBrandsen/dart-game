import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

type Mode = 'solo' | 'duos';

export default function ModeToggle({
  mode,
  onChange,
}: {
  mode: Mode;
  onChange: (mode: Mode) => void;
}) {
  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[styles.button, mode === 'solo' && styles.selected]}
        onPress={() => onChange('solo')}
      >
        <Text style={[styles.text, mode === 'solo' && styles.textSelected]}>Solo</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.button, mode === 'duos' && styles.selected]}
        onPress={() => onChange('duos')}
      >
        <Text style={[styles.text, mode === 'duos' && styles.textSelected]}>Duos</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderWidth: 1,
    borderRadius: 25,
    overflow: 'hidden',
    width: 180,
    height: 40,
    top: 30,
  },
  button: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ddd',
  },
  selected: {
    backgroundColor: '#4a90e2',
  },
  text: {
    color: '#333',
    fontWeight: '600',
  },
  textSelected: {
    color: '#fff',
    fontWeight: '700',
  },
});
