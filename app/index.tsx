import * as Crypto from 'expo-crypto';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import ModeToggle from '../components/ModeToggle';
import PlayerSelector from '../components/PlayerSelector';

// Team colors for visualization
const TEAM_COLORS = [
  '#FF9999', // soft red
  '#99CCFF', // soft blue
  '#99FF99', // soft green
  '#FFCC99', // soft orange
  '#CC99FF', // soft purple
  '#FFD699', // soft yellow-orange
  '#99FFD6', // soft mint
  '#FF99CC', // soft pink
  '#B3FF99', // soft lime
  '#99E6FF'  // soft sky blue
];

export type RootStackParamList = {
  Home: undefined;
  Game: {
    mode: 'solo' | 'duos';
    teams: Team[];
    teamCapacity: number;
  };
};

type Player = {
  id: string;
  name: string;
};

type Team = {
  id: string;
  color: string;
  players: Player[];
};

export default function HomeScreen() {
  const [mode, setMode] = useState<'solo' | 'duos'>('solo');
  const [allPlayers, setAllPlayers] = useState<Player[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [currentTeamIndex, setCurrentTeamIndex] = useState(0);
  const [selectedPlayers, setSelectedPlayers] = useState<Player[]>([]);
  const [assignedPlayerIds, setAssignedPlayerIds] = useState<string[]>([]);
  const [assignedPlayerColors, setAssignedPlayerColors] = useState<Record<string, string>>({});
  const router = useRouter();
  
  // Team capacity (1 for solo, 2 for duos)
  const teamCapacity = mode === 'solo' ? 1 : 2;
  
  // Reset state when mode changes
  useEffect(() => {
    setTeams([]);
    setCurrentTeamIndex(0);
    setSelectedPlayers([]);
    setAssignedPlayerIds([]);         // Clear assigned player IDs
    setAssignedPlayerColors({});      // Clear assigned player colors
  }, [mode]);

  // Create a new team
  const createNewTeam = () => {
    const newTeam = {
      id: Crypto.randomUUID(),
      color: TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length],
      players: []
    };
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  // Handle player selection
  const handlePlayerSelect = (players: Player[]) => {
    setSelectedPlayers(players);
  };

  // Assign selected players to current team (only for duos)
  const assignToTeam = () => {
    if (selectedPlayers.length === 0) {
      alert('Please select at least one player');
      return;
    }

    let updatedTeams = [...teams];
    let fillingHole = false;

    // If the current team slot doesn't exist, create it
    if (!updatedTeams[currentTeamIndex]) {
      const newTeam = {
        id: Crypto.randomUUID(),
        color: TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length],
        players: [],
      };
      updatedTeams[currentTeamIndex] = newTeam;
    }

    // If the current team is empty, we're filling a hole
    if (updatedTeams[currentTeamIndex].players.length === 0) {
      fillingHole = true;
    }

    // Assign selected players to the current team slot
    updatedTeams[currentTeamIndex] = {
      ...updatedTeams[currentTeamIndex],
      players: [...selectedPlayers],
    };

    setTeams(updatedTeams);

    setAssignedPlayerIds(prev => [
      ...prev,
      ...selectedPlayers.map(p => p.id)
    ]);

    setSelectedPlayers([]);

    // If we just filled a previously empty team, jump to the end
    if (fillingHole) {
      setCurrentTeamIndex(updatedTeams.length);
    } else {
      setCurrentTeamIndex(prev => prev + 1);
    }

    // Build a map of assigned playerId to their team color
    const assignedPlayerColors = updatedTeams.reduce((acc, team) => {
      team.players.forEach(player => {
        acc[player.id] = team.color;
      });
      return acc;
    }, {} as Record<string, string>);

    setAssignedPlayerColors(assignedPlayerColors);
  };

  const startGame = (filteredTeams: Team[]) => {
    if (filteredTeams.length < 2) {
      alert('Please create at least two teams');
      return;
    }
    router.push({
      pathname: '/game',
      params: {
        mode,
        teams: JSON.stringify(filteredTeams),
        teamCapacity,
      },
    });
  };

  const teamTitle = mode === 'solo' 
    ? 'Select players' 
    : `Select players for Team ${currentTeamIndex + 1}`;

  // Auto-assign when team is full (only in duos mode)
  useEffect(() => {
    if (selectedPlayers.length === teamCapacity) {
      assignToTeam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayers, teamCapacity, mode]);

  const handleAssignedPlayerPress = (player: Player) => {
    // Find the team index this player was in
    const teamIndex = teams.findIndex(team => team.players.some(p => p.id === player.id));

    // Remove player from all teams, but DO NOT filter out empty teams
    const updatedTeams = teams.map(team => ({
      ...team,
      players: team.players.filter(p => p.id !== player.id)
    }));

    setTeams(updatedTeams);

    // Remove from assignedPlayerIds
    setAssignedPlayerIds(prev => prev.filter(id => id !== player.id));

    // Remove from assignedPlayerColors
    setAssignedPlayerColors(prev => {
      const newColors = { ...prev };
      delete newColors[player.id];
      return newColors;
    });

    // Remove from selectedPlayers if present
    setSelectedPlayers(prev => prev.filter(p => p.id !== player.id));

    // Set currentTeamIndex to the team that was just emptied (if it still exists)
    if (teamIndex !== -1) {
      setCurrentTeamIndex(teamIndex);

      // NEW: Set selectedPlayers to the remaining players in that team
      const remainingPlayers = updatedTeams[teamIndex].players;
      setSelectedPlayers(remainingPlayers);
    } else {
      setCurrentTeamIndex(updatedTeams.length);
      setSelectedPlayers([]);
    }
  };

  // Update assignedPlayerColors for selected players (for immediate coloring)
  useEffect(() => {
    // Only color selected players who aren't already assigned
    setAssignedPlayerColors(prev => {
      // Copy previous colors
      const newColors = { ...prev };
      // Assign color to selected players for the current team
      selectedPlayers.forEach(player => {
        newColors[player.id] = TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length];
      });
      // Remove color for players no longer selected and not assigned to any team
      Object.keys(newColors).forEach(playerId => {
        const isAssigned = assignedPlayerIds.includes(playerId);
        const isSelected = selectedPlayers.some(p => p.id === playerId);
        if (!isAssigned && !isSelected) {
          delete newColors[playerId];
        }
      });
      return newColors;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedPlayers, currentTeamIndex]);

  // Helper to check if all teams are full
  const filteredTeams = teams.filter(team => team.players.length > 0);
  const moreThan1Team = filteredTeams.length >= 2;

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 }}>
        <ModeToggle mode={mode} onChange={setMode} />
      </View>
      {/* <Text style={{ fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 20, width: 70 }}>
        { Team {currentTeamIndex}: {teams[currentTeamIndex-1]?.players.map(p => p.name).join(', ')} }
      </Text> */}
      
      <PlayerSelector
        title={teamTitle}
        teamColor={TEAM_COLORS[currentTeamIndex % TEAM_COLORS.length]}
        selectedPlayers={selectedPlayers}
        assignedPlayerIds={assignedPlayerIds}
        assignedPlayerColors={assignedPlayerColors} // <-- pass this prop
        onSelectionChange={handlePlayerSelect}
        onAssignedPlayerPress={handleAssignedPlayerPress}
        maxPlayers={teamCapacity}
        allPlayers={allPlayers}
        setAllPlayers={setAllPlayers}
      />

      <TouchableOpacity
        style={[
          styles.startGameButton,
          !moreThan1Team && styles.startGameButtonDisabled
        ]}
        onPress={() => startGame(filteredTeams)}
        disabled={!moreThan1Team}
      >
        <Text style={styles.startGameButtonText}>Start Game</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  teamsContainer: {
    marginVertical: 15,
    padding: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
  },
  teamsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  teamBadge: {
    padding: 8,
    borderRadius: 4,
    marginVertical: 4,
  },
  teamText: {
    fontSize: 14,
    fontWeight: '500',
  },
  startGameButton: {
    bottom: -180,
    width: 200,
    alignSelf: 'center',
    backgroundColor: '#2196F3',
    paddingVertical: 16,
    marginHorizontal: 32,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 10,
  },
  startGameButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  startGameButtonText: {
    textAlign: 'center',
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
});