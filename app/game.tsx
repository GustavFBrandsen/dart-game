import { useLocalSearchParams, useNavigation } from 'expo-router';
import React, { useState } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, Vibration, View } from 'react-native';
import Footer from '../components/Footer';

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

// Add this helper function above your component
function rotatePlayers(team) {
  if (!team.players || team.players.length < 2) return team;
  return {
    ...team,
    players: [...team.players.slice(1), team.players[0]],
  };
}

export default function GameScreen() {
  const { mode, teams, teamCapacity } = useLocalSearchParams();
  const navigation = useNavigation();
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
  // Add a state to hold the teams with their rotated player order
  const [teamsWithOrder, setTeamsWithOrder] = useState(parsedTeams);
  const [popup, setPopup] = useState<string | null>(null);

  // Calculate a shared width for all columns (including the first column)
  const numCols = teamsWithOrder.length + 1;
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
    setTeamsWithOrder(prev =>
      prev.map((team, idx) =>
        idx === turnIdx ? rotatePlayers(team) : team
      )
    );
    const nextTurnIdx = (turnIdx + 1) % teamsWithOrder.length;
    setTurnIdx(nextTurnIdx);

    // Show custom popup for next player's turn
    const nextPlayer = teamsWithOrder[nextTurnIdx]?.players?.[0]?.name || 'Player';
    setPopup(`${nextPlayer}'s turn`);
    setTimeout(() => setPopup(null), 3000);
  };

  React.useEffect(() => {
    const currentTeam = teamsWithOrder[turnIdx];
    const currentPlayer = currentTeam?.players?.[0]?.name || 'Player';
    navigation.setOptions({ title: `${currentPlayer}'s turn` });
  }, [turnIdx, teamsWithOrder, navigation]);

  return (
    <View style={{ flexDirection: 'row', top: 60, height: '93%' }}>
      {/* Custom popup */}
      {popup && (
        <View style={styles.popupOverlay}>
          <View style={styles.popupContainer}>
            <Text style={styles.popupText}>{popup}</Text>
          </View>
        </View>
      )}
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
            {teamsWithOrder.map((team, idx) => (
              <View
                style={[
                  styles.headerCell,
                  { width: cellWidth },
                  idx === turnIdx && styles.activeTurnHeaderCell
                ]}
                key={team.id || idx}
              >
                {/* Render each player name on a new line */}
                {team.players.map((p, i) => (
                  <Text style={styles.headerText} key={p.id || i}>
                    {p.name}
                  </Text>
                ))}
              </View>
            ))}
          </View>
          {/* Data rows */}
          {rowLabels.map((_, rowIdx) => (
            <View style={{ flexDirection: 'row' }} key={rowIdx}>
              {teamsWithOrder.map((_, teamIdx) => {
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
      <Footer />
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
    height: 48,
    justifyContent: 'center',
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
    height: 48,
  },
  cellText: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  endTurnButtonContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 70,
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
  popupOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)', // darken the background
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  popupContainer: {
    backgroundColor: '#222',
    borderRadius: 16,
    paddingHorizontal: 36,
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.97,
    marginTop: -75,
  },
  popupText: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});