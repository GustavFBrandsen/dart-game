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
      color: TEAM_COLORS[teams.length % TEAM_COLORS.length], // Use teams.length for color
      players: []
    };
    setTeams(prev => [...prev, newTeam]);
    return newTeam;
  };

  // Handle player selection and assign immediately
  const handlePlayerSelect = (players: Player[]) => {
    setSelectedPlayers(players);

    // Assign after every player press
    let updatedTeams = [...teams];

    // Ensure the current team exists
    if (!updatedTeams[currentTeamIndex]) {
      const newTeam = createNewTeam();
      updatedTeams[currentTeamIndex] = newTeam;
    }

    // Assign players to the team
    updatedTeams[currentTeamIndex] = {
      ...updatedTeams[currentTeamIndex],
      players: [...players],
    };

    setTeams(updatedTeams);
    setAssignedPlayerIds(prev => {
      // Add only new player IDs
      const newIds = players.map(p => p.id).filter(id => !prev.includes(id));
      return [...prev, ...newIds];
    });

    // Update player colors
    const assignedPlayerColors = updatedTeams.reduce((acc, team) => {
      team.players.forEach(player => {
        acc[player.id] = team.color;
      });
      return acc;
    }, {} as Record<string, string>);
    setAssignedPlayerColors(assignedPlayerColors);

    // Only jump to next team if full
    if (players.length === teamCapacity) {
      // Find the next incomplete team
      const nextTeamIndex = findFirstIncompleteTeam(updatedTeams, teamCapacity);
      setCurrentTeamIndex(nextTeamIndex);
      setSelectedPlayers(updatedTeams[nextTeamIndex]?.players || []);
    }
  };

  const findFirstIncompleteTeam = (teams: Team[], teamCapacity: number) => {
    // First check existing teams for any that aren't full
    for (let i = 0; i < teams.length; i++) {
      if (teams[i].players.length < teamCapacity) {
        return i;
      }
    }
    // If all teams are full, return the next index (which will create a new team)
    return teams.length;
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

  const handleAssignedPlayerPress = (player: Player) => {
    const updatedTeams = [...teams];
    
    // Remove player from their team
    for (let i = 0; i < updatedTeams.length; i++) {
      updatedTeams[i] = {
        ...updatedTeams[i],
        players: updatedTeams[i].players.filter(p => p.id !== player.id)
      };
    }

    setTeams(updatedTeams);
    setAssignedPlayerIds(prev => prev.filter(id => id !== player.id));
    
    // Update colors
    setAssignedPlayerColors(prev => {
      const newColors = { ...prev };
      delete newColors[player.id];
      return newColors;
    });

    // Find first incomplete team to focus on
    const nextTeamIndex = findFirstIncompleteTeam(updatedTeams, teamCapacity);
    setCurrentTeamIndex(nextTeamIndex);
    
    // Select remaining players in the newly focused team
    if (updatedTeams[nextTeamIndex]) {
      setSelectedPlayers(updatedTeams[nextTeamIndex].players);
    } else {
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