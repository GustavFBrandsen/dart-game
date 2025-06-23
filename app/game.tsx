import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';

const screenWidth = Dimensions.get('window').width;

// Fisher-Yates shuffle
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export default function GameScreen() {
  const { mode, teams, teamCapacity } = useLocalSearchParams();
  // Randomize teams order on mount
  const parsedTeams = React.useMemo(() => {
    const t = typeof teams === 'string' ? JSON.parse(teams) : teams;
    return shuffleArray(t);
  }, [teams]);
  const rowLabels = [
    '20', '19', '18', '17', '16', '15', '14', '13', '12', 'Double', 'Triple', 'Bull'
  ];

  // State: { [rowIdx_teamIdx]: mode }
  const [cellModes, setCellModes] = useState<{ [key: string]: number }>({});
  const [turnIdx, setTurnIdx] = useState(0);
  const [lastTurnIdx, setLastTurnIdx] = useState<number | null>(null);

  // Calculate a shared width for all columns (including the first column)
  const numCols = parsedTeams.length + 1;
  const cellWidth = Math.max(100, screenWidth / numCols); // or just 100 if you want fixed width
  const labelWidth = cellWidth; // fixed width for the first column

  // Helper to get symbol for mode
  const getSymbol = (mode: number) => {
    if (mode === 1) return '/';
    if (mode === 2) return 'X';
    if (mode === 3) return 'Ⓧ';
    return '';
  };

  // Handle cell press (only for current turn)
  const handleCellPress = (rowIdx: number, teamIdx: number) => {
    if (teamIdx !== turnIdx) return; // Only allow for current turn
    const key = `${rowIdx}_${teamIdx}`;
    setCellModes(prev => {
      const prevMode = prev[key] || 0;
      if (prevMode < 3) {
        Vibration.vibrate(10);
        return { ...prev, [key]: prevMode + 1 };
      }
      return prev;
    });
  };

  // Handle cell long press (allow undo for every cell)
  const handleCellLongPress = (rowIdx: number, teamIdx: number) => {
    const key = `${rowIdx}_${teamIdx}`;
    setCellModes(prev => {
      const prevMode = prev[key] || 0;
      if (prevMode > 0) {
        Vibration.vibrate(10);
        return { ...prev, [key]: prevMode - 1 };
      }
      return prev;
    });
  };

  // Handle end turn button
  const handleEndTurn = () => {
    setLastTurnIdx(turnIdx);
    setTurnIdx((turnIdx + 1) % parsedTeams.length);
  };

  return (
    <View style={{ flex: 1, flexDirection: 'row' }}>
      {/* Fixed first column */}
      <View>
        {/* Header cell */}
        <View style={[styles.headerCell, { width: labelWidth }]}>
          <Text></Text>
        </View>
        {/* Row labels */}
        {rowLabels.map((label, rowIdx) => (
          <View style={[styles.cell, { width: labelWidth }]} key={rowIdx}>
            <Text>{label}</Text>
          </View>
        ))}
      </View>
      {/* Scrollable team columns */}
      <ScrollView horizontal style={{ flex: 1 }}>
        <View>
          {/* Header row */}
          <View style={{ flexDirection: 'row' }}>
            {parsedTeams.map((team, idx) => (
              <View
                style={[
                  styles.headerCell,
                  { width: cellWidth },
                  idx === turnIdx && styles.activeTurnHeaderCell
                ]}
                key={team.id || idx}
              >
                <Text style={styles.headerText}>
                  {team.players.map(p => p.name).join(', ')}
                </Text>
              </View>
            ))}
          </View>
          {/* Data rows */}
          {rowLabels.map((_, rowIdx) => (
            <View style={{ flexDirection: 'row' }} key={rowIdx}>
              {parsedTeams.map((_, teamIdx) => {
                const key = `${rowIdx}_${teamIdx}`;
                const mode = cellModes[key] || 0;
                const isActive = teamIdx === turnIdx;
                return (
                  <TouchableOpacity
                    style={[styles.cell, { width: cellWidth }]}
                    key={teamIdx}
                    onPress={() => handleCellPress(rowIdx, teamIdx)}
                    onLongPress={() => handleCellLongPress(rowIdx, teamIdx)}
                    delayLongPress={600}
                    disabled={!isActive}
                  >
                    <Text style={styles.cellText}>{getSymbol(mode)}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>
      {/* End turn button at the bottom */}
      <View style={styles.endTurnButtonContainer}>
        <TouchableOpacity style={styles.endTurnButton} onPress={handleEndTurn}>
          <Text style={styles.endTurnButtonText}>End turn</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  headerCell: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    backgroundColor: '#f0f0f0',
    alignItems: 'center',
    height: 48, // Add this line
    justifyContent: 'center', // Add this for vertical centering
  },
  activeTurnHeaderCell: {
    backgroundColor: '#8be78b',
  },
  headerText: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  cell: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    justifyContent: 'center',
    height: 48, // Add this line
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  endTurnButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  endTurnButton: {
    backgroundColor: '#2196F3',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    borderRadius: 8,
    minWidth: 180,
  },
  endTurnButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 20,
  },
});