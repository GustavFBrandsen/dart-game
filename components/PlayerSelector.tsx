import * as Crypto from 'expo-crypto';
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { addPlayer, getPlayers, Player } from '../storage/players';

type PlayerSelectorProps = {
  title: string;
  teamColor: string;
  selectedPlayers: Player[];
  onSelectionChange: (selected: Player[]) => void;
  maxPlayers: number;
  allPlayers: Player[];
  setAllPlayers: (players: Player[]) => void;
  assignedPlayerIds: string[];
  assignedPlayerColors: Record<string, string>;
  onAssignedPlayerPress?: (player: Player) => void;
};

export default function PlayerSelector({
  title,
  teamColor,
  selectedPlayers,
  onSelectionChange,
  maxPlayers,
  allPlayers,
  setAllPlayers,
  assignedPlayerIds,
  assignedPlayerColors,
  onAssignedPlayerPress,
}: PlayerSelectorProps) {
  const [newName, setNewName] = useState('');
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    (async () => {
      const storedPlayers = await getPlayers();
      setAllPlayers(storedPlayers);
    })();
  }, []);

  const isSelected = (player: Player) =>
    selectedPlayers.some((p) => p.id === player.id);

  const togglePlayer = (player: Player) => {
    if (isSelected(player)) {
      // Deselect player
      onSelectionChange(selectedPlayers.filter((p) => p.id !== player.id));
    } else {
      // Don't select if at max capacity
      if (selectedPlayers.length >= maxPlayers) return;
      onSelectionChange([...selectedPlayers, player]);
    }
  };

  const handleAdd = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;

    const newPlayer = { id: Crypto.randomUUID(), name: trimmed };

    try {
      await addPlayer(newPlayer);
      const updatedPlayers = [...allPlayers, newPlayer];
      setAllPlayers(updatedPlayers);
      setNewName('');
      
      // Auto-select if under capacity
      if (selectedPlayers.length < maxPlayers) {
        onSelectionChange([...selectedPlayers, newPlayer]);
      }

      // Scroll to bottom after adding
      setTimeout(() => {
        listRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error('Error adding player:', error);
    }
  };

  return (
    <View style={{ marginVertical: 20, width: '100%' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
        <View style={[styles.teamColorIndicator, { backgroundColor: teamColor }]} />
        <Text style={{ fontSize: 16, fontWeight: 'bold', marginLeft: 8 }}>
          {title}
        </Text>
        <Text style={{ marginLeft: 'auto' }}>
          {selectedPlayers.length}/{maxPlayers}
        </Text>
      </View>

      <FlatList
        ref={listRef}
        data={allPlayers}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const selected = isSelected(item);
          const isAssigned = assignedPlayerIds.includes(item.id);
          const color = assignedPlayerColors[item.id];

          return (
            <TouchableOpacity
              style={[
                styles.playerRow,
                selected && { backgroundColor: `${teamColor}33` }, // 20% opacity
                { 
                  backgroundColor: color ? color : 'white',
                  opacity: isAssigned ? 0.7 : 1,
                }
              ]}
              onPress={() => {
                if (isAssigned && onAssignedPlayerPress) {
                  onAssignedPlayerPress(item);
                } else if (!isAssigned) {
                  // Normal selection logic
                  const newSelection = selectedPlayers.some(p => p.id === item.id)
                    ? selectedPlayers.filter(p => p.id !== item.id)
                    : [...selectedPlayers, item];
                  onSelectionChange(newSelection);
                }
              }}
            >
              <View style={[
                styles.checkbox, 
                selected && styles.checkboxChecked,
                selected && { borderColor: teamColor, backgroundColor: teamColor },
                {
                  borderColor: color ? color : '#ccc',
                  backgroundColor: isAssigned ? color : 'white',
                }
              ]}>
                {selected && <Text style={styles.checkmark}>✓</Text>}
                {isAssigned && !selected && (
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>✓</Text>
                )}
              </View>
              <Text style={[styles.playerName, { color: isAssigned ? '#fff' : '#222' }]}>
                {item.name}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <TextInput
        value={newName}
        onChangeText={setNewName}
        placeholder="Add new player"
        style={styles.input}
        onSubmitEditing={handleAdd}
      />
      <TouchableOpacity
        style={[styles.addButton, !newName.trim() && styles.disabledButton]}
        onPress={handleAdd}
        disabled={!newName.trim()}
      >
        <Text style={styles.buttonText}>Add Player</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  teamColorIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  playerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#888',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: 'white',
    fontWeight: 'bold',
  },
  playerName: {
    fontSize: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    marginVertical: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    borderRadius: 4,
  },
  addButton: {
    backgroundColor: '#2196F3',
    padding: 12,
    borderRadius: 4,
    alignItems: 'center',
    marginTop: 5,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
});